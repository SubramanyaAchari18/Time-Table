/**
 * Firebase Authentication helpers.
 *
 * Supported flows (as required):
 * - Email + Password
 * - Google Sign-In (popup)
 * - Phone number with OTP (reCAPTCHA required by Firebase)
 */

import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { firebaseAuth } from "./firebaseConfig";

export async function signUpEmailPassword(email, password) {
  return await createUserWithEmailAndPassword(firebaseAuth, email, password);
}

export async function signInEmailPassword(email, password) {
  return await signInWithEmailAndPassword(firebaseAuth, email, password);
}

export async function signInWithGooglePopup() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return await signInWithPopup(firebaseAuth, provider);
}

export async function signOutUser() {
  await signOut(firebaseAuth);
}

export function subscribeToAuthChanges(cb) {
  return onAuthStateChanged(firebaseAuth, cb);
}

/**
 * Send OTP SMS to a phone number in E.164 format (ex: +15551234567).
 * `recaptchaContainerId` should be an element id in the DOM.
 */
export async function startPhoneSignIn(phoneNumberE164, recaptchaContainerId) {
  const verifier = new RecaptchaVerifier(firebaseAuth, recaptchaContainerId, {
    size: "invisible",
  });
  try {
    return await signInWithPhoneNumber(firebaseAuth, phoneNumberE164, verifier);
  } catch (e) {
    verifier.clear();
    throw e;
  }
}

export async function confirmPhoneOtp(confirmation, otpCode) {
  return await confirmation.confirm(otpCode);
}
