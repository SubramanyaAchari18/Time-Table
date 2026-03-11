/**
 * Firebase initialization (client-side).
 * Uses Vite env vars (VITE_FIREBASE_*) from `project-genesis/.env`.
 */

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const requiredKeys = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];

const missing = requiredKeys.filter((k) => !firebaseConfig[k]);
if (missing.length) {
  throw new Error(
    `Firebase is not configured. Missing: ${missing
      .map(
        (k) =>
          `VITE_FIREBASE_${String(k)
            .replace(/[A-Z]/g, (m) => "_" + m)
            .toUpperCase()}`,
      )
      .join(", ")}`,
  );
}

export const firebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firestoreDb = getFirestore(firebaseApp);
export const firebaseStorage = getStorage(firebaseApp);
