import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  startAfter,
  updateDoc,
  where,
  serverTimestamp,
  QueryDocumentSnapshot,
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
  isStudent?: boolean;
  usid?: string;
}): Promise<void> {
  await setDoc(doc(db, "users", input.uid), {
    fullName: input.fullName,
    email: input.email,
    userType: input.userType,
    profileCompleted: false,
    ...(input.userType === "company" && input.companyName
      ? { companyName: input.companyName }
      : {}),
    ...(input.userType === "candidate"
      ? {
          isStudent: Boolean(input.isStudent),
          ...(input.isStudent && input.usid?.trim()
            ? { usid: input.usid.trim() }
            : {}),
        }
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

export async function deleteUserProfile(uid: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid));
}

export async function fetchUsersByType(
  userType: UserType,
  max = 2000
): Promise<AppUser[]> {
  const pageSize = 250;
  const results: AppUser[] = [];
  let last: QueryDocumentSnapshot | undefined;

  while (results.length < max) {
    const take = Math.min(pageSize, max - results.length);
    const q = last
      ? query(
          collection(db, "users"),
          where("userType", "==", userType),
          startAfter(last),
          limit(take)
        )
      : query(
          collection(db, "users"),
          where("userType", "==", userType),
          limit(take)
        );
    const snap = await getDocs(q);
    if (snap.empty) break;
    results.push(
      ...snap.docs.map((d) => ({
        uid: d.id,
        ...(d.data() as Omit<AppUser, "uid">),
      }))
    );
    last = snap.docs[snap.docs.length - 1];
    if (snap.size < take) break;
  }

  return results;
}
