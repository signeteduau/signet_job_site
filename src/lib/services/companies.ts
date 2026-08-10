import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppUser } from "@/types/firestore";

export type FollowedCompany = {
  id: string;
  companyId: string;
  companyName: string;
  logoUrl?: string;
  timestamp?: unknown;
};

export async function fetchCompanyProfile(
  companyId: string
): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, "users", companyId));
  if (!snap.exists()) return null;
  const data = snap.data() as DocumentData;
  if (data.userType && data.userType !== "company") return null;
  return { uid: companyId, ...(data as Omit<AppUser, "uid">) };
}

export async function isFollowingCompany(
  uid: string,
  companyId: string
): Promise<boolean> {
  const snap = await getDoc(
    doc(db, "users", uid, "followedCompanies", companyId)
  );
  return snap.exists();
}

export async function followCompany(
  uid: string,
  company: { companyId: string; companyName: string; logoUrl?: string }
): Promise<void> {
  await setDoc(doc(db, "users", uid, "followedCompanies", company.companyId), {
    companyId: company.companyId,
    companyName: company.companyName,
    logoUrl: company.logoUrl || "",
    timestamp: serverTimestamp(),
  });
}

export async function unfollowCompany(
  uid: string,
  companyId: string
): Promise<void> {
  await deleteDoc(doc(db, "users", uid, "followedCompanies", companyId));
}

export async function fetchFollowedCompanies(
  uid: string
): Promise<FollowedCompany[]> {
  const snap = await getDocs(collection(db, "users", uid, "followedCompanies"));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      companyId: data.companyId || d.id,
      companyName: data.companyName || "",
      logoUrl: data.logoUrl || "",
      timestamp: data.timestamp,
    };
  });
}
