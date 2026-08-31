import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { withdrawApplication, fetchUserApplications } from "@/lib/services/applications";
import { fetchUserChats } from "@/lib/services/chat";
import {
  deleteJob,
  fetchCompanyJobs,
} from "@/lib/services/jobs";
import { AppUser } from "@/types/firestore";

async function deleteCollectionDocs(
  colRef: ReturnType<typeof collection>,
  max = 200
): Promise<void> {
  const snap = await getDocs(query(colRef, limit(max)));
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  if (snap.size >= max) {
    await deleteCollectionDocs(colRef, max);
  }
}

async function deleteUserStorage(uid: string): Promise<void> {
  const paths = [`profile_images/${uid}.jpg`];
  for (const path of paths) {
    try {
      await deleteObject(ref(storage, path));
    } catch {
      /* file may not exist */
    }
  }
}

export async function deleteAllUserData(
  uid: string,
  profile: AppUser | null
): Promise<void> {
  const apps = await fetchUserApplications(uid);
  for (const app of apps) {
    try {
      await withdrawApplication(uid, app.jobId, app.companyId);
    } catch {
      /* best effort */
    }
  }

  if (profile?.userType === "company") {
    const jobs = await fetchCompanyJobs(uid);
    for (const job of jobs) {
      try {
        await deleteJob(job.id, uid);
      } catch {
        /* best effort */
      }
    }
  }

  await deleteCollectionDocs(collection(db, "users", uid, "savedJobs"));
  await deleteCollectionDocs(collection(db, "users", uid, "notifications"));
  await deleteCollectionDocs(collection(db, "users", uid, "followedCompanies"));

  const chats = await fetchUserChats(uid);
  for (const chat of chats) {
    try {
      await deleteCollectionDocs(
        collection(db, "chats", chat.id, "messages")
      );
      await deleteDoc(doc(db, "chats", chat.id));
    } catch {
      /* best effort */
    }
  }

  await deleteUserStorage(uid);
  await deleteDoc(doc(db, "users", uid));
}

export async function submitDeletionRequest(input: {
  fullName: string;
  accountEmail: string;
  contactEmail?: string;
  message?: string;
}): Promise<void> {
  await addDoc(collection(db, "accountDeletionRequests"), {
    fullName: input.fullName.trim(),
    accountEmail: input.accountEmail.trim().toLowerCase(),
    contactEmail: (input.contactEmail || input.accountEmail)
      .trim()
      .toLowerCase(),
    message: input.message?.trim() || "",
    status: "pending",
    source: "web",
    createdAt: serverTimestamp(),
  });
}
