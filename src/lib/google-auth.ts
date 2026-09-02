import { FirebaseError } from "firebase/app";

/** Thrown after signInWithRedirect — page is navigating away; do not show an error toast. */
export class GoogleRedirectInProgress extends Error {
  constructor() {
    super("Google sign-in redirect in progress");
    this.name = "GoogleRedirectInProgress";
  }
}

export function isGoogleRedirectInProgress(err: unknown): boolean {
  return err instanceof GoogleRedirectInProgress;
}

export function getGoogleAuthErrorMessage(err: unknown): string {
  const code = err instanceof FirebaseError ? err.code : "";
  switch (code) {
    case "auth/unauthorized-domain":
      return "This site is not authorized for Google sign-in. In Firebase Console → Authentication → Settings → Authorized domains, add localhost and signetemploymenthub.com (and www if you use it).";
    case "auth/popup-blocked":
      return "Popup was blocked. Allow popups for this site, or we will try redirect sign-in.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Google sign-in was cancelled.";
    case "auth/operation-not-allowed":
      return "Google sign-in is disabled. Enable Google under Firebase → Authentication → Sign-in method.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email using a different sign-in method. Try email and password instead.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return code ? `Google sign-in failed (${code}).` : "Google sign-in failed.";
  }
}

export const GOOGLE_AUTH_USER_TYPE_KEY = "signet.googleAuth.userType";
export const GOOGLE_AUTH_COMPANY_KEY = "signet.googleAuth.companyName";
export const GOOGLE_AUTH_RETURN_URL_KEY = "signet.googleAuth.returnUrl";
export const GOOGLE_AUTH_IS_STUDENT_KEY = "signet.googleAuth.isStudent";
export const GOOGLE_AUTH_USID_KEY = "signet.googleAuth.usid";
