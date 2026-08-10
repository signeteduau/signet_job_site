"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import AuthGate from "@/app/components/signet/auth-gate";
import AppShell from "@/app/components/signet/app-shell";
import JobCard from "@/app/components/signet/job-card";
import { JobListShimmer, PanelShimmer } from "@/app/components/signet/shimmer";
import { useAuth } from "@/context/auth-context";
import {
  CompanyDashboardStats,
  fetchCompanyDashboard,
} from "@/lib/services/company-dashboard";
import { formatAppliedDate } from "@/lib/job-utils";
import Wrapper from "@/layouts/wrapper";

function CompanyHomeInner() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<CompanyDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        setStats(await fetchCompanyDashboard(user.uid));
      } catch {
        toast.error("Could not load company dashboard.");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const jobs = stats?.jobs || [];

  return (
    <AppShell
      role="company"
      title={profile?.companyName || "Company dashboard"}
      subtitle="Track openings, applicants, and interviews."
    >
      <div className="signet-stats">
        <Link href="/company/jobs" className="stat text-decoration-none">
          <div className="n">{stats?.totalJobs ?? "—"}</div>
          <div className="l">Posted jobs</div>
        </Link>
        <Link href="/company/jobs" className="stat text-decoration-none">
          <div className="n">{stats?.activeJobs ?? "—"}</div>
          <div className="l">Active</div>
        </Link>
        <Link href="/company/applications" className="stat text-decoration-none">
          <div className="n">{stats?.applicationCount ?? "—"}</div>
          <div className="l">Applications</div>
        </Link>
        <Link href="/company/applications" className="stat text-decoration-none">
          <div className="n">{stats?.interviewCount ?? "—"}</div>
          <div className="l">Interviews</div>
        </Link>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h3 style={{ color: "#12141A", fontWeight: 700, fontSize: 20, margin: 0 }}>
          Recent applicants
        </h3>
        <Link href="/company/jobs/new" className="signet-btn">
          Post a job
        </Link>
      </div>

      {loading && (
        <>
          <PanelShimmer rows={3} />
          <JobListShimmer count={3} />
        </>
      )}

      {!loading && (stats?.recentApplicants.length || 0) === 0 && (
        <div className="signet-empty mb-4">
          <h4>No applicants yet</h4>
          <p>When candidates apply, they&apos;ll show up here.</p>
          <Link href="/company/jobs/new" className="signet-btn mt-2">
            Create your first vacancy
          </Link>
        </div>
      )}

      {!loading &&
        stats?.recentApplicants.map((app) => {
          const applicantId = app.userId || app.id;
          return (
            <Link
              key={`${app.jobId}-${applicantId}`}
              href={`/company/applications/${app.jobId}/${applicantId}`}
              className="signet-panel d-block text-decoration-none"
            >
              <div className="d-flex justify-content-between gap-2 flex-wrap">
                <div>
                  <div style={{ color: "#12141A", fontWeight: 750 }}>
                    {app.jobTitle}
                  </div>
                  <div style={{ color: "#6B7280", fontSize: 13 }}>
                    Applicant {applicantId.slice(0, 8)}…
                    {formatAppliedDate(app.appliedAt)
                      ? ` · ${formatAppliedDate(app.appliedAt)}`
                      : ""}
                  </div>
                </div>
                <span
                  className={`signet-status ${
                    app.status === "Rejected"
                      ? "rejected"
                      : app.status === "Interview Scheduled"
                      ? "interview"
                      : app.status === "Hired"
                      ? "hired"
                      : ""
                  }`}
                >
                  {app.status || "Under Review"}
                </span>
              </div>
            </Link>
          );
        })}

      <div className="d-flex justify-content-between align-items-center mt-4 mb-3">
        <h3 style={{ color: "#12141A", fontWeight: 700, fontSize: 20, margin: 0 }}>
          Recent postings
        </h3>
        <Link href="/company/jobs" style={{ color: "#004CF0", fontWeight: 700 }}>
          See all
        </Link>
      </div>

      {!loading && jobs.length === 0 && (
        <div className="signet-empty">
          <h4>No jobs posted yet</h4>
          <p>Create your first vacancy to start receiving applications.</p>
        </div>
      )}
      {jobs.slice(0, 5).map((job) => (
        <JobCard
          key={job.id}
          job={job}
          href={`/company/applications?jobId=${job.id}`}
          showDescription={false}
          footer={
            <div className="d-flex gap-2 flex-wrap">
              <span className="signet-status">
                {job.applicantsCount || 0} applicants · {job.status || "Active"}
              </span>
              <Link
                href={`/company/jobs/${job.id}/edit`}
                className="signet-btn secondary"
                onClick={(e) => e.stopPropagation()}
              >
                Edit
              </Link>
            </div>
          }
        />
      ))}
    </AppShell>
  );
}

export default function CompanyHomePage() {
  return (
    <Wrapper>
      <AuthGate role="company">
        <CompanyHomeInner />
      </AuthGate>
    </Wrapper>
  );
}
