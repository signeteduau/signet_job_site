import { fetchCompanyJobs } from "@/lib/services/jobs";
import { fetchJobApplications } from "@/lib/services/applications";
import { Application, Job } from "@/types/firestore";

export type RecentApplicant = Application & {
  jobTitle: string;
};

export type CompanyDashboardStats = {
  jobs: Job[];
  totalJobs: number;
  activeJobs: number;
  applicationCount: number;
  interviewCount: number;
  hiredCount: number;
  recentApplicants: RecentApplicant[];
};

/** One parallel fetch of jobs + applications (avoids waterfall of separate pages). */
export async function fetchCompanyDashboard(
  companyId: string
): Promise<CompanyDashboardStats> {
  const jobs = await fetchCompanyJobs(companyId);
  const appLists = await Promise.all(
    jobs.map(async (j) => {
      try {
        const apps = await fetchJobApplications(j.id);
        return apps.map((a) => ({ ...a, jobTitle: j.title, jobId: j.id }));
      } catch {
        return [] as RecentApplicant[];
      }
    })
  );
  const all = appLists.flat();
  const interviewCount = all.filter(
    (a) => a.status === "Interview Scheduled"
  ).length;
  const hiredCount = all.filter((a) => a.status === "Hired").length;
  const recentApplicants = [...all]
    .sort((a, b) => {
      const as =
        (a.appliedAt as { seconds?: number })?.seconds ||
        (typeof a.appliedAt === "number" ? a.appliedAt : 0);
      const bs =
        (b.appliedAt as { seconds?: number })?.seconds ||
        (typeof b.appliedAt === "number" ? b.appliedAt : 0);
      return Number(bs) - Number(as);
    })
    .slice(0, 8);

  return {
    jobs,
    totalJobs: jobs.length,
    activeJobs: jobs.filter((j) => (j.status || "Active") === "Active").length,
    applicationCount: all.length,
    interviewCount,
    hiredCount,
    recentApplicants,
  };
}
