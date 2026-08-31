import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Application, ApplicationStatus, Job } from "@/types/firestore";

function mapApp(id: string, data: DocumentData): Application {
  return {
    id,
    jobId: data.jobId || id,
    title: data.title || "",
    companyId: data.companyId || "",
    companyName: data.companyName || "",
    appliedAt: data.appliedAt,
    resumeFile: data.resumeFile || "",
    resumeUrl: data.resumeUrl || "",
    phone: data.phone || "",
    userId: data.userId || "",
    status: data.status || "Under Review",
    interviewDate: data.interviewDate || "",
    interviewTime: data.interviewTime || "",
    rejectionReason: data.rejectionReason || "",
    logoUrl: data.logoUrl || "",
    location: data.location || "",
    type: data.type || "",
    salary: data.salary || "",
  };
}

export async function hasApplied(
  uid: string,
  jobId: string
): Promise<boolean> {
  const snap = await getDoc(
    doc(db, "applications", uid, "userApplications", jobId)
  );
  return snap.exists();
}

export async function fetchUserApplications(uid: string): Promise<Application[]> {
  const q = query(
    collection(db, "applications", uid, "userApplications"),
    orderBy("appliedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapApp(d.id, d.data()));
}

export async function fetchJobApplications(
  jobId: string
): Promise<Application[]> {
  const q = query(
    collection(db, "jobs", jobId, "applications"),
    orderBy("appliedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapApp(d.id, d.data()));
}

export async function applyToJob(opts: {
  userId: string;
  job: Job;
  resumeUrl: string;
  resumeFile: string;
  phone?: string;
}): Promise<void> {
  const { userId, job, resumeUrl, resumeFile, phone } = opts;
  const payload = {
    jobId: job.id,
    title: job.title,
    companyId: job.companyId,
    companyName: job.companyName,
    logoUrl: job.logoUrl || "",
    location: job.location,
    type: job.type,
    salary: job.salary,
    appliedAt: serverTimestamp(),
    resumeFile,
    resumeUrl,
    phone: phone || "",
    userId,
    status: "Under Review" as ApplicationStatus,
  };

  // Critical writes — candidate + job application records
  await setDoc(doc(db, "applications", userId, "userApplications", job.id), payload);
  await setDoc(doc(db, "jobs", job.id, "applications", userId), payload);

  // Best-effort: mobile app mirror + applicant counts (must not fail the apply flow)
  const secondary: Promise<unknown>[] = [
    updateDoc(doc(db, "jobs", job.id), { applicantsCount: increment(1) }).catch(
      () => undefined
    ),
  ];

  if (job.companyId) {
    secondary.push(
      setDoc(
        doc(db, "companies", job.companyId, "jobs", job.id, "applications", userId),
        payload
      ).catch(() => undefined),
      setDoc(
        doc(db, "companies", job.companyId, "jobs", job.id),
        { applicantsCount: increment(1) },
        { merge: true }
      ).catch(() => undefined)
    );
  }

  await Promise.all(secondary);
}

export async function withdrawApplication(
  userId: string,
  jobId: string,
  companyId: string
): Promise<void> {
  await deleteDoc(doc(db, "applications", userId, "userApplications", jobId));
  await deleteDoc(doc(db, "jobs", jobId, "applications", userId));
  if (companyId) {
    await deleteDoc(
      doc(db, "companies", companyId, "jobs", jobId, "applications", userId)
    );
  }
}

export async function updateApplicationStatus(opts: {
  jobId: string;
  companyId: string;
  applicantId: string;
  status: ApplicationStatus;
  interviewDate?: string;
  interviewTime?: string;
  rejectionReason?: string;
}): Promise<void> {
  const payload: {
    status: ApplicationStatus;
    interviewDate?: string;
    interviewTime?: string;
    rejectionReason?: string;
  } = {
    status: opts.status,
  };
  if (opts.interviewDate) payload.interviewDate = opts.interviewDate;
  if (opts.interviewTime) payload.interviewTime = opts.interviewTime;
  if (opts.rejectionReason) payload.rejectionReason = opts.rejectionReason;

  await updateDoc(
    doc(db, "jobs", opts.jobId, "applications", opts.applicantId),
    payload
  );
  await updateDoc(
    doc(
      db,
      "companies",
      opts.companyId,
      "jobs",
      opts.jobId,
      "applications",
      opts.applicantId
    ),
    payload
  );
  await updateDoc(
    doc(db, "applications", opts.applicantId, "userApplications", opts.jobId),
    payload
  );
}
