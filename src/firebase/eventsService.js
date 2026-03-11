import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { firestoreDb } from "./firebaseConfig";

export async function getEventsForMonth(userId, year, month) {
  const monthStr = String(month + 1).padStart(2, "0");
  const start = `${year}-${monthStr}-01`;
  const end = `${year}-${monthStr}-31`;

  const q = query(
    collection(firestoreDb, "studyEvents"),
    where("userId", "==", userId),
    where("date", ">=", start),
    where("date", "<=", end),
    orderBy("date", "asc"),
  );

  const snaps = await getDocs(q);
  return snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createEvent(input) {
  const ref = await addDoc(collection(firestoreDb, "studyEvents"), input);
  const snap = await getDoc(ref);
  return { id: ref.id, ...snap.data() };
}

export async function updateEvent(id, patch) {
  const ref = doc(firestoreDb, "studyEvents", id);
  await updateDoc(ref, patch);
}

export async function deleteEvent(id) {
  await deleteDoc(doc(firestoreDb, "studyEvents", id));
}
