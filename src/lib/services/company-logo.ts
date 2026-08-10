import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type LogoJob = {
  companyId: string;
  logoUrl?: string;
  [key: string]: unknown;
};

const cache = new Map<string, string>();

function usableUrl(value?: unknown): string {
  const v = String(value || "").trim();
  if (!v) return "";
  try {
    const uri = new URL(v);
    return uri.protocol.startsWith("http") ? v : "";
  } catch {
    return "";
  }
}

export function resolveLogoFromRecord(
  data?: Record<string, unknown> | null
): string {
  if (!data) return "";
  for (const key of ["logoUrl", "logo", "profileImage", "photoURL", "photoUrl"]) {
    const url = usableUrl(data[key]);
    if (url) return url;
  }
  return "";
}

export async function fetchCompanyLogo(companyId: string): Promise<string> {
  const id = companyId.trim();
  if (!id) return "";
  if (cache.has(id)) return cache.get(id)!;
  try {
    const snap = await getDoc(doc(db, "users", id));
    const url = resolveLogoFromRecord(
      snap.exists() ? (snap.data() as Record<string, unknown>) : null
    );
    cache.set(id, url);
    return url;
  } catch {
    cache.set(id, "");
    return "";
  }
}

/** Fill missing job.logoUrl from company user profiles (same as Flutter). */
export async function enrichJobLogos<T extends LogoJob>(jobs: T[]): Promise<T[]> {
  const missing = new Set<string>();
  for (const job of jobs) {
    const existing = resolveLogoFromRecord(job as Record<string, unknown>);
    if (existing) {
      job.logoUrl = existing;
      continue;
    }
    if (job.companyId) missing.add(job.companyId);
  }

  await Promise.all([...missing].map((id) => fetchCompanyLogo(id)));

  return jobs.map((job) => {
    const existing = resolveLogoFromRecord(job as Record<string, unknown>);
    if (existing) return { ...job, logoUrl: existing };
    const cached = cache.get(job.companyId || "") || "";
    return cached ? { ...job, logoUrl: cached } : job;
  });
}
