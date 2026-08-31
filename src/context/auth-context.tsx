"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { resolvePostLoginPath } from "@/lib/auth-flow";
import { auth } from "@/lib/firebase";
import {
  GOOGLE_AUTH_COMPANY_KEY,
  GOOGLE_AUTH_RETURN_URL_KEY,
  GOOGLE_AUTH_USER_TYPE_KEY,
  GoogleRedirectInProgress,
} from "@/lib/google-auth";
import {
  createUserProfile,
  getUserProfile,
  completeProfileSetup,
  updateUserProfile,
} from "@/lib/services/users";
import { requestVerificationEmail } from "@/lib/services/verification-email";
import { AppUser, UserType } from "@/types/firestore";

type AuthContextType = {
  user: User | null;
  profile: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (opts: {
    name: string;
    email: string;
    password: string;
    userType: UserType;
    companyName?: string;
  }) => Promise<User>;
  loginWithGoogle: (opts?: {
    userType?: UserType;
    companyName?: string;
    returnUrl?: string | null;
  }) => Promise<User>;
  logout: () => Promise<void>;
  sendVerification: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshProfile: () => Promise<AppUser | null>;
  finishProfileSetup: (data: Partial<AppUser>) => Promise<void>;
  saveProfile: (data: Partial<AppUser>) => Promise<void>;
  homePath: string;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function resolveHomePath(profile: AppUser | null, user: User | null): string {
  if (!user) return "/login";
  if (!user.emailVerified) return "/verify-email";
  if (!profile) return "/role-select";
  if (!profile.profileCompleted) return "/profile-setup";
  return profile.userType === "company" ? "/company" : "/candidate";
}

async function ensureGoogleUserProfile(
  firebaseUser: User,
  userType?: UserType,
  companyName?: string
): Promise<AppUser | null> {
  let profile = await getUserProfile(firebaseUser.uid);
  if (profile || !userType) {
    return profile;
  }

  const fullName =
    userType === "company"
      ? companyName?.trim() || firebaseUser.displayName || "Company"
      : firebaseUser.displayName || "User";

  await createUserProfile({
    uid: firebaseUser.uid,
    email: firebaseUser.email || "",
    fullName,
    userType,
    companyName:
      userType === "company"
        ? companyName?.trim() || firebaseUser.displayName || "Company"
        : undefined,
  });
  profile = await getUserProfile(firebaseUser.uid);
  return profile;
}

function buildGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  provider.addScope("email");
  provider.addScope("profile");
  return provider;
}

function storeGoogleAuthIntent(
  userType?: UserType,
  companyName?: string,
  returnUrl?: string | null
) {
  if (typeof window === "undefined") return;
  if (userType) {
    sessionStorage.setItem(GOOGLE_AUTH_USER_TYPE_KEY, userType);
  } else {
    sessionStorage.removeItem(GOOGLE_AUTH_USER_TYPE_KEY);
  }
  if (companyName?.trim()) {
    sessionStorage.setItem(GOOGLE_AUTH_COMPANY_KEY, companyName.trim());
  } else {
    sessionStorage.removeItem(GOOGLE_AUTH_COMPANY_KEY);
  }
  if (returnUrl) {
    sessionStorage.setItem(GOOGLE_AUTH_RETURN_URL_KEY, returnUrl);
  } else {
    sessionStorage.removeItem(GOOGLE_AUTH_RETURN_URL_KEY);
  }
}

function readGoogleAuthIntent(): {
  userType?: UserType;
  companyName?: string;
  returnUrl?: string | null;
} {
  if (typeof window === "undefined") {
    return {};
  }
  const userType = sessionStorage.getItem(GOOGLE_AUTH_USER_TYPE_KEY) as
    | UserType
    | null;
  const companyName = sessionStorage.getItem(GOOGLE_AUTH_COMPANY_KEY);
  const returnUrl = sessionStorage.getItem(GOOGLE_AUTH_RETURN_URL_KEY);
  sessionStorage.removeItem(GOOGLE_AUTH_USER_TYPE_KEY);
  sessionStorage.removeItem(GOOGLE_AUTH_COMPANY_KEY);
  sessionStorage.removeItem(GOOGLE_AUTH_RETURN_URL_KEY);
  return {
    userType: userType === "company" || userType === "candidate" ? userType : undefined,
    companyName: companyName || undefined,
    returnUrl,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const u = auth.currentUser;
    if (!u) {
      setProfile(null);
      return null;
    }
    const p = await getUserProfile(u.uid);
    setProfile(p);
    return p;
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const redirectResult = await getRedirectResult(auth);
        if (!redirectResult?.user || !mounted) return;
        const intent = readGoogleAuthIntent();
        const p = await ensureGoogleUserProfile(
          redirectResult.user,
          intent.userType,
          intent.companyName
        );
        setUser(redirectResult.user);
        setProfile(p);
        if (typeof window !== "undefined") {
          window.location.replace(
            resolvePostLoginPath(p, redirectResult.user, intent.returnUrl)
          );
        }
      } catch {
        // Redirect errors surface on the next explicit sign-in attempt.
      }
    })();

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!mounted) return;
      setUser(u);
      if (u) {
        try {
          const p = await getUserProfile(u.uid);
          setProfile(p);
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      profile,
      loading,
      homePath: resolveHomePath(profile, user),
      refreshProfile,
      login: async (email, password) => {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        await refreshProfile();
        return cred.user;
      },
      register: async ({ name, email, password, userType, companyName }) => {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          await updateProfile(cred.user, { displayName: name });
        }
        await createUserProfile({
          uid: cred.user.uid,
          email,
          fullName: name,
          userType,
          companyName,
        });
        await requestVerificationEmail();
        await refreshProfile();
        return cred.user;
      },
      loginWithGoogle: async ({ userType, companyName, returnUrl } = {}) => {
        const provider = buildGoogleProvider();
        storeGoogleAuthIntent(userType, companyName, returnUrl);

        let cred;
        try {
          cred = await signInWithPopup(auth, provider);
        } catch (err) {
          const code = err instanceof FirebaseError ? err.code : "";
          if (code === "auth/popup-blocked") {
            await signInWithRedirect(auth, provider);
            throw new GoogleRedirectInProgress();
          }
          sessionStorage.removeItem(GOOGLE_AUTH_USER_TYPE_KEY);
          sessionStorage.removeItem(GOOGLE_AUTH_COMPANY_KEY);
          sessionStorage.removeItem(GOOGLE_AUTH_RETURN_URL_KEY);
          throw err;
        }

        sessionStorage.removeItem(GOOGLE_AUTH_USER_TYPE_KEY);
        sessionStorage.removeItem(GOOGLE_AUTH_COMPANY_KEY);
        sessionStorage.removeItem(GOOGLE_AUTH_RETURN_URL_KEY);

        const p = await ensureGoogleUserProfile(
          cred.user,
          userType,
          companyName
        );
        setProfile(p);
        return cred.user;
      },
      logout: async () => {
        await fbSignOut(auth);
        setProfile(null);
      },
      sendVerification: async () => {
        await requestVerificationEmail();
      },
      resetPassword: async (email) => {
        await sendPasswordResetEmail(auth, email);
      },
      changePassword: async (currentPassword, newPassword) => {
        const u = auth.currentUser;
        if (!u?.email) throw new Error("Not signed in");
        const cred = EmailAuthProvider.credential(u.email, currentPassword);
        await reauthenticateWithCredential(u, cred);
        await updatePassword(u, newPassword);
      },
      finishProfileSetup: async (data) => {
        if (!auth.currentUser) throw new Error("Not signed in");
        await completeProfileSetup(auth.currentUser.uid, data);
        await refreshProfile();
      },
      saveProfile: async (data) => {
        if (!auth.currentUser) throw new Error("Not signed in");
        await updateUserProfile(auth.currentUser.uid, data);
        await refreshProfile();
      },
    }),
    [user, profile, loading, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export { resolveHomePath };
