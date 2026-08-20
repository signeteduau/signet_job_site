import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Job } from "@/types/firestore";
import { enrichJobLogos, resolveLogoFromRecord } from "@/lib/services/company-logo";
import { normalizeJobType, jobMatchesSearchTerm } from "@/lib/job-utils";

function mapJob(id: string, data: DocumentData): Job {
  return {
    id,
    jobId: data.jobId || id,
    companyId: data.companyId || "",
    companyName: data.companyName || "",
    logoUrl: resolveLogoFromRecord(data as Record<string, unknown>),
    title: data.title || "",
    salary: data.salary || "",
    location: data.location || "",
    type: data.type || "",
    priority: data.priority || "",
    category: data.category || "",
    currency: data.currency || "",
    experience: data.experience || "",
    skills: data.skills || [],
    description: data.description || "",
    rolesAndResponsibilities: data.rolesAndResponsibilities || "",
    attachmentUrl: data.attachmentUrl || "",
    status: data.status || "Active",
    applicantsCount: data.applicantsCount || 0,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

function onlyActive(jobs: Job[]): Job[] {
  return jobs.filter((j) => {
    const s = (j.status || "Active").toLowerCase();
    return s === "active" || s === "";
  });
}

export async function fetchJobs(max = 50, opts?: { activeOnly?: boolean }): Promise<Job[]> {
  const q = query(
    collection(db, "jobs"),
    orderBy("createdAt", "desc"),
    limit(Math.max(max * 2, max))
  );
  const snap = await getDocs(q);
  let list = await enrichJobLogos(snap.docs.map((d) => mapJob(d.id, d.data())));
  if (opts?.activeOnly !== false) list = onlyActive(list);
  return list.slice(0, max);
}

export async function fetchJobById(jobId: string): Promise<Job | null> {
  const snap = await getDoc(doc(db, "jobs", jobId));
  if (!snap.exists()) return null;
  const [job] = await enrichJobLogos([mapJob(snap.id, snap.data())]);
  return job;
}

export async function fetchCompanyJobs(companyId: string): Promise<Job[]> {
  const q = query(
    collection(db, "companies", companyId, "jobs"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return enrichJobLogos(snap.docs.map((d) => mapJob(d.id, d.data())));
}

export async function searchJobs(opts: {
  term?: string;
  type?: string;
  location?: string;
  priority?: string;
  category?: string;
  experience?: string;
  activeOnly?: boolean;
}): Promise<Job[]> {
  const jobs = await fetchJobs(100, { activeOnly: opts.activeOnly !== false });
  const term = (opts.term || "").trim().toLowerCase();
  const typeNorm = normalizeJobType(opts.type);
  return jobs.filter((j) => {
    if (typeNorm && normalizeJobType(j.type) !== typeNorm) return false;
    if (
      opts.location &&
      !j.location.toLowerCase().includes(opts.location.toLowerCase())
    ) {
      return false;
    }
    if (
      opts.priority &&
      (j.priority || "").toLowerCase() !== opts.priority.toLowerCase()
    ) {
      return false;
    }
    if (
      opts.category &&
      !(j.category || "").toLowerCase().includes(opts.category.toLowerCase())
    ) {
      return false;
    }
    if (
      opts.experience &&
      !(j.experience || "")
        .toLowerCase()
        .includes(opts.experience.toLowerCase())
    ) {
      return false;
    }
    if (!term) return true;
    return jobMatchesSearchTerm(j, term);
  });
}

export type CreateJobInput = {
  companyId: string;
  companyName: string;
  logoUrl?: string;
  title: string;
  salary: string;
  location: string;
  type: string;
  priority?: string;
  category?: string;
  currency?: string;
  experience?: string;
  skills?: string[];
  description?: string;
  rolesAndResponsibilities?: string;
  attachmentUrl?: string;
};

export async function createJob(input: CreateJobInput): Promise<string> {
  const payload = {
    ...input,
    status: "Active",
    applicantsCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, "jobs"), payload);
  await updateDoc(ref, { jobId: ref.id });

  await setDoc(doc(db, "companies", input.companyId, "jobs", ref.id), {
    ...payload,
    jobId: ref.id,
  });

  return ref.id;
}

export async function updateJob(
  jobId: string,
  companyId: string,
  data: Partial<CreateJobInput> & { status?: string }
): Promise<void> {
  const payload = { ...data, updatedAt: serverTimestamp() };
  await updateDoc(doc(db, "jobs", jobId), payload);
  await updateDoc(doc(db, "companies", companyId, "jobs", jobId), payload);
}

async function deleteCollectionDocs(
  colRef: ReturnType<typeof collection>,
  max = 200
): Promise<void> {
  const snap = await getDocs(query(colRef, limit(max)));
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

export async function deleteJob(
  jobId: string,
  companyId: string
): Promise<void> {
  try {
    await deleteCollectionDocs(collection(db, "jobs", jobId, "applications"));
  } catch {
    /* ignore */
  }
  try {
    await deleteCollectionDocs(
      collection(db, "companies", companyId, "jobs", jobId, "applications")
    );
  } catch {
    /* ignore */
  }
  await deleteDoc(doc(db, "jobs", jobId));
  await deleteDoc(doc(db, "companies", companyId, "jobs", jobId));
}

export async function fetchCompanies(max = 20) {
  const q = query(
    collection(db, "users"),
    where("userType", "==", "company"),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}

export async function assertJobOwnedByCompany(
  jobId: string,
  companyId: string
): Promise<Job | null> {
  const job = await fetchJobById(jobId);
  if (!job || job.companyId !== companyId) return null;
  return job;
}
