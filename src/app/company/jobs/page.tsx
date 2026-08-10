"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import AuthGate from "@/app/components/signet/auth-gate";
import AppShell from "@/app/components/signet/app-shell";
import JobCard from "@/app/components/signet/job-card";
import { JobListShimmer } from "@/app/components/signet/shimmer";
import { useAuth } from "@/context/auth-context";
import { deleteJob, fetchCompanyJobs } from "@/lib/services/jobs";
import { Job } from "@/types/firestore";
import Wrapper from "@/layouts/wrapper";

function PostedJobsInner() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      setJobs(await fetchCompanyJobs(user.uid));
    } catch {
      toast.error("Could not load posted jobs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <AppShell role="company" title="Posted jobs">
      <div className="mb-3">
        <Link href="/company/jobs/new" className="signet-btn">
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
          href={`/company/applications?jobId=${job.id}`}
          footer={
            <div className="d-flex gap-2 flex-wrap">
              <Link
                href={`/company/applications?jobId=${job.id}`}
                className="signet-btn secondary"
              >
                Applications ({job.applicantsCount || 0})
              </Link>
              <Link
                href={`/company/jobs/${job.id}/edit`}
                className="signet-btn secondary"
              >
                Edit
              </Link>
              <button
                className="signet-btn danger"
                onClick={async () => {
                  if (!user || !confirm("Delete this job?")) return;
                  try {
                    await deleteJob(job.id, user.uid);
                    toast.success("Job deleted.");
                    load();
                  } catch {
                    toast.error("Could not delete job.");
                  }
                }}
              >
                Delete
              </button>
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
        <PostedJobsInner />
      </AuthGate>
    </Wrapper>
  );
}
