import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { firestoreDb, firebaseStorage } from "./firebaseConfig";

function safeFileName(name) {
  return name.replace(/[\\/]/g, "_");
}

function createdAtMillis(item) {
  const ts = item?.createdAt;
  if (ts && typeof ts.toMillis === "function") {
    return ts.toMillis();
  }
  const client = item?.createdAtClient;
  return typeof client === "number" ? client : 0;
}

export function subscribeToFolders(params) {
  const qFolders = query(
    collection(firestoreDb, "folders"),
    where("userId", "==", params.userId),
  );
  return onSnapshot(
    qFolders,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => {
        const t = createdAtMillis(a) - createdAtMillis(b);
        if (t !== 0) return t;
        return (a.name || "").localeCompare(b.name || "");
      });
      params.onChange(items);
    },
    (err) => params.onError?.(err),
  );
}

export async function createFolder(params) {
  const payload = {
    userId: params.userId,
    name: params.name,
    createdAt: serverTimestamp(),
    createdAtClient: Date.now(),
  };
  const d = await addDoc(collection(firestoreDb, "folders"), payload);
  return { id: d.id, ...payload };
}

export function subscribeToFiles(params) {
  const constraints = [where("userId", "==", params.userId)];
  if (params.folderId)
    constraints.push(where("folderId", "==", params.folderId));
  const qFiles = query(collection(firestoreDb, "files"), ...constraints);

  return onSnapshot(
    qFiles,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => createdAtMillis(b) - createdAtMillis(a));
      params.onChange(items);
    },
    (err) => params.onError?.(err),
  );
}

export async function uploadFile(params) {
  const folderSegment = params.folderId ?? "root";
  const storagePath = `notes/${folderSegment}/${Date.now()}_${safeFileName(params.file.name)}`;
  const storageRef = ref(firebaseStorage, storagePath);

  const uploadTask = uploadBytesResumable(storageRef, params.file, {
    contentType: params.file.type || undefined,
  });

  if (params.signal) {
    const handleAbort = () => {
      uploadTask.cancel();
    };
    params.signal.addEventListener("abort", handleAbort);
  }

  const result = await new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const percent = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
        );
        if (!Number.isNaN(percent)) {
          params.onProgress?.(percent);
        }
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const fileURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ fileURL, snapshot: uploadTask.snapshot });
        } catch (e) {
          reject(e);
        }
      },
    );
  });

  const docRef = await addDoc(collection(firestoreDb, "files"), {
    userId: params.userId,
    folderId: params.folderId ?? null,
    name: params.file.name,
    fileURL: result.fileURL,
    storagePath,
    size: params.file.size,
    type: params.file.type || "",
    createdAt: serverTimestamp(),
    createdAtClient: Date.now(),
  });

  return { id: docRef.id, storagePath, fileURL: result.fileURL };
}

export async function deleteFile(params) {
  const fileRef = doc(firestoreDb, "files", params.fileId);
  const snap = await getDoc(fileRef);
  if (!snap.exists()) return;
  const data = snap.data();

  const storagePath =
    typeof data.storagePath === "string" ? data.storagePath : undefined;
  if (storagePath) {
    try {
      await deleteObject(ref(firebaseStorage, storagePath));
    } catch {
      // ignore (already deleted / permission issues)
    }
  }
  await deleteDoc(fileRef);
}

export async function deleteFolder(params) {
  // Delete all files in this folder first (metadata + storage)
  const qFiles = query(
    collection(firestoreDb, "files"),
    where("userId", "==", params.userId),
    where("folderId", "==", params.folderId),
  );
  const snaps = await getDocs(qFiles);
  await Promise.all(snaps.docs.map((d) => deleteFile({ fileId: d.id })));

  // Then delete the folder doc
  await deleteDoc(doc(firestoreDb, "folders", params.folderId));
}

export async function resolveDownloadUrl(params) {
  return await getDownloadURL(ref(firebaseStorage, params.storagePath));
}
