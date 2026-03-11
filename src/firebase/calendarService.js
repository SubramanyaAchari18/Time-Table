import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { firestoreDb } from "./firebaseConfig";
import { toLocalDateKey } from "@/lib/utils";

function monthRange(year, month) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { start: toLocalDateKey(start), end: toLocalDateKey(end) };
}

export function subscribeToMonthEvents(params) {
  const { start, end } = monthRange(params.year, params.month);
  const constraints = [
    where("userId", "==", params.userId),
    where("eventDate", ">=", start),
    where("eventDate", "<=", end),
    orderBy("eventDate", "asc"),
  ];
  const q = query(collection(firestoreDb, "calendarEvents"), ...constraints);
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      params.onChange(items);
    },
    (err) => params.onError?.(err),
  );
}

export function subscribeToUpcomingEvents(params) {
  const today = new Date();
  const start = toLocalDateKey(today);
  const future = new Date();
  future.setDate(future.getDate() + params.daysAhead);
  const end = toLocalDateKey(future);

  const constraints = [
    where("userId", "==", params.userId),
    where("eventDate", ">=", start),
    where("eventDate", "<=", end),
    orderBy("eventDate", "asc"),
  ];
  const q = query(collection(firestoreDb, "calendarEvents"), ...constraints);
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      params.onChange(items);
    },
    (err) => params.onError?.(err),
  );
}

export function subscribeToRangeEvents(params) {
  const constraints = [
    where("userId", "==", params.userId),
    where("eventDate", ">=", params.startDate),
    where("eventDate", "<=", params.endDate),
    orderBy("eventDate", "asc"),
  ];
  const q = query(collection(firestoreDb, "calendarEvents"), ...constraints);
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      params.onChange(items);
    },
    (err) => params.onError?.(err),
  );
}

export function subscribeToUserEvents(params) {
  const constraints = [where("userId", "==", params.userId)];
  const q = query(collection(firestoreDb, "calendarEvents"), ...constraints);
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Sort on client to avoid needing a composite index
      items.sort((a, b) => {
        const aTs = a.createdAt?.toMillis?.() ?? 0;
        const bTs = b.createdAt?.toMillis?.() ?? 0;
        return aTs - bTs;
      });
      params.onChange(items);
    },
    (err) => {
      console.error("Firebase fetch error:", err);
      params.onError?.(err);
    },
  );
}

export async function createCalendarEvent(input) {
  const payload = {
    ...input,
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(firestoreDb, "calendarEvents"), payload);
  return { id: ref.id, ...payload };
}

export async function updateCalendarEvent(id, patch) {
  const ref = doc(firestoreDb, "calendarEvents", id);
  await updateDoc(ref, patch);
}

export async function deleteCalendarEvent(id) {
  await deleteDoc(doc(firestoreDb, "calendarEvents", id));
}
