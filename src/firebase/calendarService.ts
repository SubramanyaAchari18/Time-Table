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
  type QueryConstraint,
  type Unsubscribe,
} from "firebase/firestore";
import { firestoreDb } from "./firebaseConfig";
import { toLocalDateKey } from "@/lib/utils";

export type CalendarEventType = "exam" | "assignment" | "study";

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  eventType: CalendarEventType;
  eventDate: string; // yyyy-MM-dd
  createdAt?: unknown;
}

type CalendarEventDoc = Omit<CalendarEvent, "id">;

function monthRange(year: number, month: number): { start: string; end: string } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { start: toLocalDateKey(start), end: toLocalDateKey(end) };
}

export function subscribeToMonthEvents(params: {
  userId: string;
  year: number;
  month: number; // 0-11
  onChange: (events: CalendarEvent[]) => void;
  onError?: (error: Error) => void;
}): Unsubscribe {
  const { start, end } = monthRange(params.year, params.month);
  const constraints: QueryConstraint[] = [
    where("userId", "==", params.userId),
    where("eventDate", ">=", start),
    where("eventDate", "<=", end),
    orderBy("eventDate", "asc"),
  ];
  const q = query(collection(firestoreDb, "calendarEvents"), ...constraints);
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as CalendarEventDoc) })) as CalendarEvent[];
      params.onChange(items);
    },
    (err) => params.onError?.(err as any)
  );
}

export function subscribeToUpcomingEvents(params: {
  userId: string;
  daysAhead: number;
  onChange: (events: CalendarEvent[]) => void;
  onError?: (error: Error) => void;
}): Unsubscribe {
  const today = new Date();
  const start = toLocalDateKey(today);
  const future = new Date();
  future.setDate(future.getDate() + params.daysAhead);
  const end = toLocalDateKey(future);

  const constraints: QueryConstraint[] = [
    where("userId", "==", params.userId),
    where("eventDate", ">=", start),
    where("eventDate", "<=", end),
    orderBy("eventDate", "asc"),
  ];
  const q = query(collection(firestoreDb, "calendarEvents"), ...constraints);
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as CalendarEventDoc) })) as CalendarEvent[];
      params.onChange(items);
    },
    (err) => params.onError?.(err as any)
  );
}

export function subscribeToRangeEvents(params: {
  userId: string;
  startDate: string; // yyyy-MM-dd
  endDate: string;   // yyyy-MM-dd
  onChange: (events: CalendarEvent[]) => void;
  onError?: (error: Error) => void;
}): Unsubscribe {
  const constraints: QueryConstraint[] = [
    where("userId", "==", params.userId),
    where("eventDate", ">=", params.startDate),
    where("eventDate", "<=", params.endDate),
    orderBy("eventDate", "asc"),
  ];
  const q = query(collection(firestoreDb, "calendarEvents"), ...constraints);
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as CalendarEventDoc) })) as CalendarEvent[];
      params.onChange(items);
    },
    (err) => params.onError?.(err as any)
  );
}

export function subscribeToUserEvents(params: {
  userId: string;
  onChange: (events: CalendarEvent[]) => void;
  onError?: (error: Error) => void;
}): Unsubscribe {
  const constraints: QueryConstraint[] = [
    where("userId", "==", params.userId),
  ];
  const q = query(collection(firestoreDb, "calendarEvents"), ...constraints);
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as CalendarEventDoc) })) as CalendarEvent[];
      // Sort on client to avoid needing a composite index
      items.sort((a, b) => {
        const aTs = (a as any).createdAt?.toMillis?.() ?? 0;
        const bTs = (b as any).createdAt?.toMillis?.() ?? 0;
        return aTs - bTs;
      });
      params.onChange(items);
    },
    (err) => {
      console.error("Firebase fetch error:", err);
      params.onError?.(err as any);
    }
  );
}

export async function createCalendarEvent(input: Omit<CalendarEvent, "id" | "createdAt">) {
  const payload: CalendarEventDoc = {
    ...input,
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(firestoreDb, "calendarEvents"), payload);
  return { id: ref.id, ...payload } as CalendarEvent;
}

export async function updateCalendarEvent(id: string, patch: Partial<Omit<CalendarEvent, "id" | "userId" | "eventDate">>) {
  const ref = doc(firestoreDb, "calendarEvents", id);
  await updateDoc(ref, patch as Partial<CalendarEventDoc>);
}

export async function deleteCalendarEvent(id: string) {
  await deleteDoc(doc(firestoreDb, "calendarEvents", id));
}

