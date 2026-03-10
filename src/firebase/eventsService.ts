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

export type StudyEventType = "exam" | "trip" | "assignment" | "study" | "other";

export interface StudyEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  date: string; // ISO yyyy-MM-dd
  type: StudyEventType;
  createdAt?: any;
  updatedAt?: any;
}

export async function getEventsForMonth(userId: string, year: number, month: number): Promise<StudyEvent[]> {
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
  return snaps.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as StudyEvent[];
}

export async function createEvent(input: Omit<StudyEvent, "id">) {
  const ref = await addDoc(collection(firestoreDb, "studyEvents"), input);
  const snap = await getDoc(ref);
  return { id: ref.id, ...(snap.data() as any) } as StudyEvent;
}

export async function updateEvent(id: string, patch: Partial<Omit<StudyEvent, "id" | "userId" | "date">>) {
  const ref = doc(firestoreDb, "studyEvents", id);
  await updateDoc(ref, patch as any);
}

export async function deleteEvent(id: string) {
  await deleteDoc(doc(firestoreDb, "studyEvents", id));
}

