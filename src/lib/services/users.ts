import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppUser, UserType } from "@/types/firestore";

export async function getUserProfile(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { uid, ...(snap.data() as Omit<AppUser, "uid">) };
}

export async function createUserProfile(input: {
  uid: string;
  email: string;
  fullName: string;
  userType: UserType;
  companyName?: string;
}): Promise<void> {
  await setDoc(doc(db, "users", input.uid), {
    fullName: input.fullName,
    email: input.email,
    userType: input.userType,
    profileCompleted: false,
    ...(input.userType === "company" && input.companyName
      ? { companyName: input.companyName }
      : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function completeProfileSetup(
  uid: string,
  data: Partial<AppUser>
): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    ...data,
    profileCompleted: true,
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserProfile(
  uid: string,
  data: Partial<AppUser>
): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
