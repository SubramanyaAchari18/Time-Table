/**
 * Firestore + Storage service functions for the timetable app.
 *
 * Required collections:
 * - users/{userId}: { name, email, createdAt }
 * - subjects/{subjectId}: { userId, subjectName, studyDuration, createdAt }
 * - studySessions/{sessionId}: { userId, subjectId, startTime, endTime, completed }
 * - streaks/{userId}: { currentStreak, longestStreak, lastStudyDate }
 * - folders/{folderId}: { userId, name, createdAt }
 * - notes/{noteId}: { userId, folderId, name, fileType, fileSizeBytes, storagePath, downloadUrl, createdAt }
 *
 * Extra collections used by existing UI:
 * - schedules/{scheduleId}: { userId, subjectId, dayOfWeek, startTime, endTime, createdAt }
 */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  Timestamp,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { firestoreDb, firebaseStorage } from "./firebaseConfig";
import { toLocalDateKey } from "@/lib/utils";

const NOTES_STORAGE_LIMIT_BYTES = 150 * 1024 * 1024; // 150 MB

// -------------------- users --------------------
export async function createUserProfile(user, extra) {
  const userRef = doc(firestoreDb, "users", user.uid);
  const name =
    extra?.name ?? user.displayName ?? user.email?.split("@")[0] ?? "Student";
  await setDoc(
    userRef,
    {
      name,
      email: user.email ?? "",
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function getUserProfile(userId) {
  const snap = await getDoc(doc(firestoreDb, "users", userId));
  return snap.exists() ? snap.data() : null;
}

export async function updateUserProfile(userId, data) {
  await setDoc(
    doc(firestoreDb, "users", userId),
    {
      ...(data.name ? { name: data.name } : {}),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

// -------------------- subjects --------------------
export async function addSubject(userId, subject) {
  const payload = {
    userId,
    subjectName: subject.subjectName,
    studyDuration: subject.studyDuration,
    color: subject.color ?? "#6366F1",
    priority: subject.priority ?? "medium",
    createdAt: serverTimestamp(),
  };
  const d = await addDoc(collection(firestoreDb, "subjects"), payload);
  return { id: d.id, ...payload };
}

export async function getSubjects(userId) {
  const q = query(
    collection(firestoreDb, "subjects"),
    where("userId", "==", userId),
  );
  const snaps = await getDocs(q);
  return snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteSubject(_userId, subjectId) {
  await deleteDoc(doc(firestoreDb, "subjects", subjectId));
}

// -------------------- schedules (needed for timetable UI) --------------------
export async function addSchedule(userId, schedule) {
  const payload = {
    userId,
    subjectId: schedule.subjectId,
    dayOfWeek: schedule.dayOfWeek,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    createdAt: serverTimestamp(),
  };
  const d = await addDoc(collection(firestoreDb, "schedules"), payload);
  return { id: d.id, ...payload };
}

export async function getSchedules(userId, dayOfWeek) {
  const constraints = [
    where("userId", "==", userId),
    orderBy("startTime", "asc"),
  ];
  if (dayOfWeek !== undefined)
    constraints.unshift(where("dayOfWeek", "==", dayOfWeek));
  const q = query(collection(firestoreDb, "schedules"), ...constraints);
  const snaps = await getDocs(q);
  return snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteSchedule(_userId, scheduleId) {
  await deleteDoc(doc(firestoreDb, "schedules", scheduleId));
}

// -------------------- study sessions + derived progress --------------------
export async function recordStudySession(params) {
  const end = new Date();
  const start = new Date(end.getTime() - params.durationSeconds * 1000);
  const payload = {
    userId: params.userId,
    subjectId: params.subjectId,
    startTime: Timestamp.fromDate(start),
    endTime: Timestamp.fromDate(end),
    completed: params.completed,
    durationSeconds: params.durationSeconds,
    gemsEarned: params.gemsEarned,
    rating: params.rating ?? null,
    createdAt: serverTimestamp(),
  };
  const d = await addDoc(collection(firestoreDb, "studySessions"), payload);
  await updateStreak(params.userId, start);
  return { id: d.id, ...payload };
}

export async function getStudySessions(userId, limit = 50) {
  const q = query(
    collection(firestoreDb, "studySessions"),
    where("userId", "==", userId),
    orderBy("startTime", "desc"),
  );
  const snaps = await getDocs(q);
  return snaps.docs.slice(0, limit).map((d) => ({ id: d.id, ...d.data() }));
}

export async function getDailyProgress(userId, days) {
  const start = new Date();
  start.setDate(start.getDate() - days);
  const q = query(
    collection(firestoreDb, "studySessions"),
    where("userId", "==", userId),
    where("startTime", ">=", Timestamp.fromDate(start)),
    orderBy("startTime", "asc"),
  );
  const snaps = await getDocs(q);

  const byDate = new Map();
  for (const docSnap of snaps.docs) {
    const row = docSnap.data();
    const dt = row.startTime?.toDate?.() ?? new Date();
    const dateStr = toLocalDateKey(dt);
    const prev = byDate.get(dateStr) ?? {
      total_study_seconds: 0,
      sessions_completed: 0,
      gems_earned: 0,
    };
    prev.total_study_seconds += Number(row.durationSeconds ?? 0);
    prev.sessions_completed += row.completed ? 1 : 0;
    prev.gems_earned += Number(row.gemsEarned ?? 0);
    byDate.set(dateStr, prev);
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([date, v]) => ({ id: date, user_id: userId, date, ...v }));
}

export async function getTodayProgress(userId) {
  const today = toLocalDateKey(new Date());
  const list = await getDailyProgress(userId, 1);
  return list.find((d) => d.date === today) ?? null;
}

// -------------------- streaks --------------------
function dateOnly(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function diffDays(a, b) {
  const ms = dateOnly(a).getTime() - dateOnly(b).getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

export async function updateStreak(userId, studyDate = new Date()) {
  const refDoc = doc(firestoreDb, "streaks", userId);
  const snap = await getDoc(refDoc);
  const today = dateOnly(studyDate);
  const todayStr = toLocalDateKey(today);

  if (!snap.exists()) {
    await setDoc(
      refDoc,
      { currentStreak: 1, longestStreak: 1, lastStudyDate: todayStr },
      { merge: true },
    );
    return;
  }

  const data = snap.data();
  const lastStr = data.lastStudyDate;
  const last = lastStr ? new Date(lastStr + "T00:00:00") : null;
  const current = Number(data.currentStreak ?? 0);
  const longest = Number(data.longestStreak ?? 0);

  let newCurrent = current;
  if (!last) newCurrent = 1;
  else {
    const delta = diffDays(today, last);
    if (delta === 0) newCurrent = Math.max(1, current);
    else if (delta === 1) newCurrent = current + 1;
    else newCurrent = 1;
  }

  const newLongest = Math.max(longest, newCurrent);
  await setDoc(
    refDoc,
    {
      currentStreak: newCurrent,
      longestStreak: newLongest,
      lastStudyDate: todayStr,
    },
    { merge: true },
  );
}

export async function getStreak(userId) {
  const snap = await getDoc(doc(firestoreDb, "streaks", userId));
  return snap.exists() ? Number(snap.data().currentStreak ?? 0) : 0;
}

// -------------------- notes folders/files (Firebase only) --------------------
export async function createFolder(userId, folder) {
  const payload = { userId, name: folder.name, createdAt: serverTimestamp() };
  const d = await addDoc(collection(firestoreDb, "folders"), payload);
  return { id: d.id, ...payload };
}

export async function getFolders(userId) {
  const q = query(
    collection(firestoreDb, "folders"),
    where("userId", "==", userId),
    orderBy("createdAt", "asc"),
  );
  const snaps = await getDocs(q);
  return snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteFolder(userId, folderId) {
  // Delete folder document
  await deleteDoc(doc(firestoreDb, "folders", folderId));

  // Delete all notes in this folder (metadata + storage + usage)
  const notesQ = query(
    collection(firestoreDb, "notes"),
    where("userId", "==", userId),
    where("folderId", "==", folderId),
  );
  const snaps = await getDocs(notesQ);
  await Promise.all(
    snaps.docs.map(async (d) => {
      await deleteNotesFile(userId, d.id);
    }),
  );
}

export async function getNotesUsage(userId) {
  const usageRef = doc(firestoreDb, "notesUsage", userId);
  const snap = await getDoc(usageRef);
  if (snap.exists()) {
    const data = snap.data();
    return {
      bytesUsed: Number(data.bytesUsed ?? 0),
      limitBytes: NOTES_STORAGE_LIMIT_BYTES,
    };
  }

  // Fallback: compute from existing notes, then persist for future fast reads.
  const qFiles = query(
    collection(firestoreDb, "notes"),
    where("userId", "==", userId),
  );
  const filesSnap = await getDocs(qFiles);
  const bytesUsed = filesSnap.docs.reduce(
    (sum, d) => sum + Number(d.data().fileSizeBytes ?? 0),
    0,
  );
  await setDoc(
    usageRef,
    { bytesUsed, updatedAt: serverTimestamp() },
    { merge: true },
  );
  return { bytesUsed, limitBytes: NOTES_STORAGE_LIMIT_BYTES };
}

export async function uploadNotesFile(params) {
  const safeName = params.file.name.replace(/[\\/]/g, "_");
  const folderSegment = params.folderId ?? "root";
  const storagePath = `notes/${params.userId}/${folderSegment}/${Date.now()}_${safeName}`;
  const storageRef = ref(firebaseStorage, storagePath);
  const usageRef = doc(firestoreDb, "notesUsage", params.userId);
  const fileDocRef = doc(collection(firestoreDb, "notes"));

  await runTransaction(firestoreDb, async (tx) => {
    const usageSnap = await tx.get(usageRef);
    const used = usageSnap.exists()
      ? Number(usageSnap.data().bytesUsed ?? 0)
      : 0;

    if (used + params.file.size > NOTES_STORAGE_LIMIT_BYTES) {
      const err = new Error(
        "Storage limit reached (150 MB). Please delete some existing notes to upload new ones.",
      );
      err.code = "STORAGE_LIMIT_REACHED";
      throw err;
    }

    tx.set(
      usageRef,
      { bytesUsed: used + params.file.size, updatedAt: serverTimestamp() },
      { merge: true },
    );
    tx.set(fileDocRef, {
      userId: params.userId,
      folderId: params.folderId ?? null,
      name: params.file.name,
      fileType: params.file.type,
      fileSizeBytes: params.file.size,
      storagePath,
      downloadUrl: null,
      status: "uploading",
      createdAt: serverTimestamp(),
    });
  });

  let uploaded = false;
  try {
    await uploadBytes(storageRef, params.file, {
      contentType: params.file.type || undefined,
    });
    uploaded = true;
    const downloadUrl = await getDownloadURL(storageRef);
    await updateDoc(fileDocRef, {
      downloadUrl,
      status: "ready",
      updatedAt: serverTimestamp(),
    });
    return {
      id: fileDocRef.id,
      userId: params.userId,
      folderId: params.folderId ?? null,
      name: params.file.name,
      fileType: params.file.type,
      fileSizeBytes: params.file.size,
      storagePath,
      downloadUrl,
    };
  } catch (e) {
    // Best-effort cleanup: remove file + release reserved bytes.
    if (uploaded) {
      try {
        await deleteObject(storageRef);
      } catch {
        // ignore
      }
    }
    try {
      await runTransaction(firestoreDb, async (tx) => {
        const usageSnap = await tx.get(usageRef);
        const used = usageSnap.exists()
          ? Number(usageSnap.data().bytesUsed ?? 0)
          : 0;
        tx.set(
          usageRef,
          {
            bytesUsed: Math.max(0, used - params.file.size),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
        tx.delete(fileDocRef);
      });
    } catch {
      // ignore
    }
    throw e;
  }
}

export async function getNotesFiles(userId, folderId) {
  const constraints = [where("userId", "==", userId)];
  if (folderId) {
    constraints.push(where("folderId", "==", folderId));
  }
  const q = query(collection(firestoreDb, "notes"), ...constraints);
  const snaps = await getDocs(q);
  const items = snaps.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Sort newest first on client to avoid needing a Firestore composite index
  return items.sort((a, b) => {
    const aTs = a.createdAt?.toMillis?.() ?? 0;
    const bTs = b.createdAt?.toMillis?.() ?? 0;
    return bTs - aTs;
  });
}

export async function deleteNotesFile(_userId, fileId) {
  const fileRef = doc(firestoreDb, "notes", fileId);
  const snap = await getDoc(fileRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const storagePath = data.storagePath;
  const fileSizeBytes = Number(data.fileSizeBytes ?? 0);
  const userId = String(data.userId ?? "");

  // Delete from Storage first (best effort). Even if it fails (already deleted), continue.
  if (storagePath) {
    try {
      await deleteObject(ref(firebaseStorage, storagePath));
    } catch {
      // ignore
    }
  }

  const usageRef = userId ? doc(firestoreDb, "notesUsage", userId) : null;
  if (usageRef) {
    await runTransaction(firestoreDb, async (tx) => {
      const usageSnap = await tx.get(usageRef);
      const used = usageSnap.exists()
        ? Number(usageSnap.data().bytesUsed ?? 0)
        : 0;
      tx.set(
        usageRef,
        {
          bytesUsed: Math.max(0, used - fileSizeBytes),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      tx.delete(fileRef);
    });
  } else {
    await deleteDoc(fileRef);
  }
}

// -------------------- achievements (simple fallback so UI doesn't break) --------------------
const DEFAULT_ACHIEVEMENTS = [
  {
    id: "1",
    name: "First Steps",
    description: "Complete your first study session",
    icon: "🌟",
    rarity: "common",
    requirement_type: "sessions",
    requirement_value: 1,
    gems_reward: 5,
  },
  {
    id: "2",
    name: "Dedicated",
    description: "Complete 5 study sessions",
    icon: "📚",
    rarity: "common",
    requirement_type: "sessions",
    requirement_value: 5,
    gems_reward: 15,
  },
  {
    id: "3",
    name: "Week Warrior",
    description: "Study 7 days in a row",
    icon: "🔥",
    rarity: "rare",
    requirement_type: "streak",
    requirement_value: 7,
    gems_reward: 50,
  },
  {
    id: "4",
    name: "Gem Collector",
    description: "Earn 100 gems",
    icon: "💎",
    rarity: "rare",
    requirement_type: "gems",
    requirement_value: 100,
    gems_reward: 25,
  },
];

export async function getAchievements() {
  return DEFAULT_ACHIEVEMENTS;
}

export async function getUserAchievements(_userId) {
  return [];
}
