import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Job, SavedJob } from "@/types/firestore";
import {
  enrichJobLogos,
  resolveLogoFromRecord,
} from "@/lib/services/company-logo";

function mapSaved(id: string, data: DocumentData): SavedJob {
  return {
    id,
    jobId: data.jobId || id,
    companyId: data.companyId || "",
    title: data.title || "",
    companyName: data.companyName || "",
    location: data.location || "",
    type: data.type || "",
    salary: data.salary || "",
    logoUrl: resolveLogoFromRecord(data as Record<string, unknown>),
    description: data.description || "",
    priority: data.priority || "",
    skills: Array.isArray(data.skills) ? data.skills : [],
    timestamp: data.timestamp,
  };
}

export async function fetchSavedJobs(uid: string): Promise<SavedJob[]> {
  const q = query(
    collection(db, "users", uid, "savedJobs"),
    orderBy("timestamp", "desc")
  );
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => mapSaved(d.id, d.data()));
  return enrichJobLogos(list);
}

export async function isJobSaved(uid: string, jobId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "users", uid, "savedJobs", jobId));
  return snap.exists();
}

export async function saveJob(uid: string, job: Job): Promise<void> {
  await setDoc(doc(db, "users", uid, "savedJobs", job.id), {
    jobId: job.id,
    companyId: job.companyId,
    title: job.title,
    companyName: job.companyName,
    location: job.location,
    type: job.type,
    salary: job.salary,
    logoUrl: job.logoUrl || "",
    description: job.description || "",
    priority: job.priority || "",
    skills: job.skills || [],
    timestamp: serverTimestamp(),
  });
}

export async function unsaveJob(uid: string, jobId: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid, "savedJobs", jobId));
}
