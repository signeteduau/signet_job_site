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
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  createUserProfile,
  getUserProfile,
  completeProfileSetup,
  updateUserProfile,
} from "@/lib/services/users";
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
  loginWithGoogle: (userType?: UserType) => Promise<User>;
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
    const unsub = onAuthStateChanged(auth, async (u) => {
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
    return () => unsub();
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
        await sendEmailVerification(cred.user);
        await refreshProfile();
        return cred.user;
      },
      loginWithGoogle: async (userType) => {
        const provider = new GoogleAuthProvider();
        const cred = await signInWithPopup(auth, provider);
        let p = await getUserProfile(cred.user.uid);
        if (!p && userType) {
          await createUserProfile({
            uid: cred.user.uid,
            email: cred.user.email || "",
            fullName: cred.user.displayName || "User",
            userType,
          });
          p = await getUserProfile(cred.user.uid);
        }
        setProfile(p);
        return cred.user;
      },
      logout: async () => {
        await fbSignOut(auth);
        setProfile(null);
      },
      sendVerification: async () => {
        if (auth.currentUser) {
          await sendEmailVerification(auth.currentUser);
        }
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
