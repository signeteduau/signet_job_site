"use client";
import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import AuthGate from "@/app/components/signet/auth-gate";
import AppShell from "@/app/components/signet/app-shell";
import JobCard from "@/app/components/signet/job-card";
import { JobListShimmer, PageLoader } from "@/app/components/signet/shimmer";
import { useAuth } from "@/context/auth-context";
import { withActingParam } from "@/lib/acting-company";
import { useActingCompany } from "@/lib/hooks/use-acting-company";
import { deleteJob, fetchCompanyJobs } from "@/lib/services/jobs";
import { Job } from "@/types/firestore";
import Wrapper from "@/layouts/wrapper";

function PostedJobsInner() {
  const { user } = useAuth();
  const { acting, companyId, companyName, isActing } = useActingCompany();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async (id: string) => {
    setLoading(true);
    try {
      setJobs(await fetchCompanyJobs(id));
    } catch {
      toast.error("Could not load posted jobs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !companyId) return;
    load(companyId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, companyId]);

  return (
    <AppShell
      role="company"
      title="Posted jobs"
      subtitle={isActing ? `Listings for ${companyName}` : undefined}
    >
      <div className="mb-3">
        <Link
          href={withActingParam("/company/jobs/new", acting)}
          className="signet-btn"
        >
          + New vacancy
        </Link>
      </div>
      {loading && <JobListShimmer count={4} />}
      {!loading && jobs.length === 0 && (
        <div className="signet-empty">
          <h4>No posted jobs</h4>
          <p>Publish a vacancy to appear in candidate search.</p>
        </div>
      )}
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          href={withActingParam(`/company/applications?jobId=${job.id}`, acting)}
          showDescription={false}
          expandable={false}
          footer={
            <div className="signet-job-manage-footer">
              <div className="signet-job-manage-actions">
                <Link
                  href={withActingParam(
                    `/company/applications?jobId=${job.id}`,
                    acting
                  )}
                  className="signet-btn secondary signet-btn-compact"
                >
                  Applications ({job.applicantsCount || 0})
                </Link>
                <Link
                  href={withActingParam(`/company/jobs/${job.id}/edit`, acting)}
                  className="signet-btn secondary signet-btn-compact"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  className="signet-btn danger signet-btn-compact"
                  onClick={async () => {
                    if (!companyId || !confirm("Delete this job?")) return;
                    try {
                      await deleteJob(job.id, companyId);
                      toast.success("Job deleted.");
                      load(companyId);
                    } catch {
                      toast.error("Could not delete job.");
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          }
        />
      ))}
    </AppShell>
  );
}

export default function CompanyJobsPage() {
  return (
    <Wrapper>
      <AuthGate role="company">
        <Suspense fallback={<PageLoader label="Loading jobs…" />}>
          <PostedJobsInner />
        </Suspense>
      </AuthGate>
    </Wrapper>
  );
}
