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
  runTransaction
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
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
  // First check if current storage used + new file size exceeds 200MB limit
  const userRef = doc(firestoreDb, "users", params.userId);
  const userSnap = await getDoc(userRef);
  const currentUsage = userSnap.exists() ? (userSnap.data().storageUsed || 0) : 0;
  const maxStorage = 200 * 1024 * 1024; // 200MB

  if (currentUsage + params.file.size > maxStorage) {
    throw new Error("Storage limit reached (200MB). Please delete some files to upload new ones.");
  }

  const storageRef = ref(
    firebaseStorage,
    `notes/${params.userId}/${Date.now()}_${safeFileName(params.file.name)}`
  );

  const uploadTask = uploadBytesResumable(storageRef, params.file);

  const result = await new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (params.onProgress) {
          params.onProgress(Math.round(percent));
        }
      },
      reject,
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({
          fileURL: downloadURL,
          storagePath: storageRef.fullPath
        });
      }
    );

    if (params.signal) {
      params.signal.addEventListener("abort", () => {
        uploadTask.cancel();
        reject(new Error("upload_aborted"));
      });
    }
  });

  let docRefId;
  
  // Use a transaction to safely update both the file doc and the user's storage limits
  await runTransaction(firestoreDb, async (transaction) => {
    const newFileRef = doc(collection(firestoreDb, "files"));
    
    // Read the user doc to get latest usage again just to be safe
    const userDocRef = doc(firestoreDb, "users", params.userId);
    const userDocSnap = await transaction.get(userDocRef);
    const safeUsage = userDocSnap.exists() ? (userDocSnap.data().storageUsed || 0) : 0;
    
    if (safeUsage + params.file.size > maxStorage) {
      throw new Error("Storage limit reached concurrently.");
    }
    
    transaction.set(newFileRef, {
      userId: params.userId,
      folderId: params.folderId ?? null,
      name: params.file.name,
      fileURL: result.fileURL,
      storagePath: result.storagePath,
      size: params.file.size,
      type: params.file.type || "",
      createdAt: serverTimestamp(),
      createdAtClient: Date.now(),
    });
    
    transaction.set(userDocRef, {
      storageUsed: safeUsage + params.file.size
    }, { merge: true });
    
    docRefId = newFileRef.id;
  });

  return { id: docRefId, fileURL: result.fileURL };
}

export async function deleteFile(params) {
  const fileRef = doc(firestoreDb, "files", params.fileId);
  let storagePathToDelete = null;
  
  await runTransaction(firestoreDb, async (transaction) => {
    const fileSnap = await transaction.get(fileRef);
    if (!fileSnap.exists()) return;
    
    const fileData = fileSnap.data();
    const fileSize = fileData.size || 0;
    storagePathToDelete = fileData.storagePath;
    
    const userRef = doc(firestoreDb, "users", fileData.userId);
    const userSnap = await transaction.get(userRef);
    
    if (userSnap.exists()) {
      const currentUsage = userSnap.data().storageUsed || 0;
      const newUsage = Math.max(0, currentUsage - fileSize);
      transaction.set(userRef, { storageUsed: newUsage }, { merge: true });
    }
    
    transaction.delete(fileRef);
  });

  if (storagePathToDelete) {
    try {
      const storageRef = ref(firebaseStorage, storagePathToDelete);
      await deleteObject(storageRef);
    } catch (err) {
      console.warn("Failed to delete from Firebase Storage:", err);
    }
  }
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
  return params.fileURL || params.storagePath || null;
}
