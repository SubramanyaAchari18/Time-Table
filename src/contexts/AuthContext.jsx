import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  confirmPhoneOtp,
  signInEmailPassword,
  signInWithGooglePopup,
  signOutUser,
  signUpEmailPassword,
  startPhoneSignIn,
  subscribeToAuthChanges,
} from "@/firebase/authService";
import { createUserProfile } from "@/firebase/firestoreService";

const AuthContext = createContext({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signInWithGoogle: async () => ({ error: null }),
  startPhoneOtp: async () => ({ confirmation: null, error: null }),
  verifyPhoneOtp: async () => ({ error: null }),
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToAuthChanges(async (u) => {
      setSession(u ? { user: u } : null);
      setLoading(false);
      if (u) {
        try {
          await createUserProfile(u);
        } catch {
          // Non-blocking: profile creation failure shouldn't break sign-in.
        }
      }
    });
    return () => unsub();
  }, []);

  const api = useMemo(() => {
    return {
      session,
      user: session?.user ?? null,
      loading,

      signOut: async () => {
        await signOutUser();
      },

      signIn: async (email, password) => {
        try {
          const cred = await signInEmailPassword(email, password);
          await createUserProfile(cred.user);
          return { error: null };
        } catch (e) {
          return {
            error:
              e instanceof Error
                ? e
                : new Error(e?.message ?? "Sign in failed"),
          };
        }
      },

      signUp: async (email, password, displayName) => {
        try {
          const cred = await signUpEmailPassword(email, password);
          await createUserProfile(cred.user, { name: displayName });
          return { error: null };
        } catch (e) {
          return {
            error:
              e instanceof Error
                ? e
                : new Error(e?.message ?? "Sign up failed"),
          };
        }
      },

      signInWithGoogle: async () => {
        try {
          const cred = await signInWithGooglePopup();
          await createUserProfile(cred.user);
          return { error: null };
        } catch (e) {
          return {
            error:
              e instanceof Error
                ? e
                : new Error(e?.message ?? "Google sign-in failed"),
          };
        }
      },

      startPhoneOtp: async (phoneNumberE164, recaptchaContainerId) => {
        try {
          const confirmation = await startPhoneSignIn(
            phoneNumberE164,
            recaptchaContainerId,
          );
          return { confirmation, error: null };
        } catch (e) {
          return {
            confirmation: null,
            error:
              e instanceof Error
                ? e
                : new Error(e?.message ?? "Failed to send OTP"),
          };
        }
      },

      verifyPhoneOtp: async (confirmation, otpCode) => {
        try {
          const cred = await confirmPhoneOtp(confirmation, otpCode);
          await createUserProfile(cred.user);
          return { error: null };
        } catch (e) {
          return {
            error:
              e instanceof Error
                ? e
                : new Error(e?.message ?? "OTP verification failed"),
          };
        }
      },
    };
  }, [session, loading]);

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
};
