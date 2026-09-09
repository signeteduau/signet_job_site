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
import { jobMatchesSearchTerm, jobTypesMatch } from "@/lib/job-utils";

function mapJob(id: string, data: DocumentData): Job {
  return {
    id,
    jobId: data.jobId || id,
    companyId: data.companyId || "",
    companyName: data.companyName || "",
    postedBy: data.postedBy || "",
    isSignetJob: !!data.isSignetJob,
    hideCompany: !!data.hideCompany,
    occupation: data.occupation || "",
    anzsco: data.anzsco || "",
    positionType: data.positionType || "",
    industry: data.industry || "",
    trainingArea: data.trainingArea || "",
    logoUrl: resolveLogoFromRecord(data as Record<string, unknown>),
    title: data.title || "",
    salary: data.salary || "",
    location: data.location || "",
    street: data.street || "",
    city: data.city || "",
    state: data.state || "",
    postcode: data.postcode || "",
    country: data.country || "",
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
  const job = mapJob(snap.id, snap.data());
  if (resolveLogoFromRecord(job as Record<string, unknown>)) return job;
  const [enriched] = await enrichJobLogos([job]);
  return enriched;
}

/** Lightweight related jobs for detail page (avoids fetching the full job board). */
export async function fetchRelatedJobs(current: Job, max = 5): Promise<Job[]> {
  const q = query(
    collection(db, "jobs"),
    orderBy("createdAt", "desc"),
    limit(24)
  );
  const snap = await getDocs(q);
  const list = onlyActive(snap.docs.map((d) => mapJob(d.id, d.data())));
  const others = list.filter((j) => j.id !== current.id);

  const scored = others
    .map((j) => {
      let score = 0;
      if (j.companyId && j.companyId === current.companyId) score += 4;
      if (
        j.companyName &&
        current.companyName &&
        j.companyName.toLowerCase() === current.companyName.toLowerCase()
      ) {
        score += 3;
      }
      if (j.category && j.category === current.category) score += 2;
      if (j.type && j.type === current.type) score += 1;
      return { j, score };
    })
    .sort((a, b) => b.score - a.score);

  const matched = scored.filter((x) => x.score > 0).map((x) => x.j);
  const fallback = scored.map((x) => x.j);
  const merged = [...matched];
  fallback.forEach((j) => {
    if (merged.length >= max) return;
    if (!merged.some((m) => m.id === j.id)) merged.push(j);
  });

  return enrichJobLogos(merged.slice(0, max));
}

export async function fetchCompanyJobs(companyId: string): Promise<Job[]> {
  const q = query(
    collection(db, "companies", companyId, "jobs"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return enrichJobLogos(snap.docs.map((d) => mapJob(d.id, d.data())));
}

function asFilterList(value?: string | string[]): string[] {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value])
    .map((item) => item.trim())
    .filter(Boolean);
}

function matchesAnyField(haystacks: string[], needles: string[]): boolean {
  if (!needles.length) return true;
  const fields = haystacks.map((item) => item.toLowerCase());
  return needles.some((needle) => {
    const n = needle.toLowerCase();
    return fields.some((field) => field.includes(n));
  });
}

export async function searchJobs(opts: {
  term?: string;
  type?: string | string[];
  location?: string | string[];
  priority?: string | string[];
  category?: string | string[];
  experience?: string | string[];
  activeOnly?: boolean;
}): Promise<Job[]> {
  const jobs = await fetchJobs(200, { activeOnly: opts.activeOnly !== false });
  const term = (opts.term || "").trim().toLowerCase();
  const types = asFilterList(opts.type);
  const locations = asFilterList(opts.location);
  const categories = asFilterList(opts.category);
  const experiences = asFilterList(opts.experience);
  const priorities = asFilterList(opts.priority);
  return jobs.filter((j) => {
    if (types.length && !types.some((t) => jobTypesMatch(j.type, t))) {
      return false;
    }
    if (
      !matchesAnyField(
        [j.location, j.city || "", j.state || ""],
        locations
      )
    ) {
      return false;
    }
    if (
      priorities.length &&
      !priorities.some(
        (p) => (j.priority || "").toLowerCase() === p.toLowerCase()
      )
    ) {
      return false;
    }
    if (!matchesAnyField([j.category || ""], categories)) {
      return false;
    }
    if (!matchesAnyField([j.experience || ""], experiences)) {
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
  street?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
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
  return snap.docs.map((d) => ({ ...d.data(), uid: d.id }));
}

export async function assertJobOwnedByCompany(
  jobId: string,
  companyId: string
): Promise<Job | null> {
  const job = await fetchJobById(jobId);
  if (!job || job.companyId !== companyId) return null;
  return job;
}
