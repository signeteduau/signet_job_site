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
import { getUserProfile } from "@/lib/services/users";
import Wrapper from "@/layouts/wrapper";

const QUICK_ACTIONS = [
  {
    href: "/company/jobs/new",
    icon: "bi-plus-circle",
    label: "Post a job",
    desc: "Create a new vacancy",
    tone: "blue",
  },
  {
    href: "/company/applications",
    icon: "bi-people",
    label: "Applications",
    desc: "Review candidates",
    tone: "violet",
  },
  {
    href: "/company/chat",
    icon: "bi-chat-dots",
    label: "Messages",
    desc: "Chat with applicants",
    tone: "teal",
  },
  {
    href: "/company/jobs",
    icon: "bi-briefcase",
    label: "Posted jobs",
    desc: "Manage your listings",
    tone: "amber",
  },
] as const;

function statusClass(status?: string) {
  if (status === "Rejected") return "rejected";
  if (status === "Interview Scheduled") return "interview";
  if (status === "Hired") return "hired";
  return "";
}

function CompanyHomeInner() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<CompanyDashboardStats | null>(null);
  const [applicantNames, setApplicantNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const companyName = profile?.companyName || "there";

  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        const data = await fetchCompanyDashboard(user.uid);
        setStats(data);
        const entries = await Promise.all(
          data.recentApplicants.map(async (app) => {
            const id = app.userId || app.id;
            const p = await getUserProfile(id);
            return [id, p?.fullName || "Applicant"] as const;
          })
        );
        setApplicantNames(Object.fromEntries(entries));
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
      title={`Welcome back, ${companyName}`}
      subtitle="Manage vacancies, review applicants, and stay connected with candidates."
    >
      <div className="signet-dash-actions">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`signet-dash-action tone-${action.tone}`}
          >
            <span className="signet-dash-action-icon">
              <i className={`bi ${action.icon}`} aria-hidden />
            </span>
            <span className="signet-dash-action-body">
              <strong>{action.label}</strong>
              <span>{action.desc}</span>
            </span>
            <i className="bi bi-chevron-right signet-dash-action-chevron" aria-hidden />
          </Link>
        ))}
      </div>

      <section className="signet-dash-section">
        <div className="signet-section-head">
          <div>
            <h3>Recent applicants</h3>
            <p>Latest candidates who applied to your roles</p>
          </div>
          <Link href="/company/applications" className="signet-section-link">
            See all
          </Link>
        </div>

        {loading && <PanelShimmer rows={3} />}

        {!loading && (stats?.recentApplicants.length || 0) === 0 && (
          <div className="signet-empty signet-panel">
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
            const appliedOn = formatAppliedDate(app.appliedAt);
            const applicantName = applicantNames[applicantId] || "Applicant";
            return (
              <Link
                key={`${app.jobId}-${applicantId}`}
                href={`/company/applications/${app.jobId}/${applicantId}`}
                className="signet-applicant-row text-decoration-none"
              >
                <div className="signet-application-head">
                  <div className="signet-application-meta">
                    <strong>{applicantName}</strong>
                    <span className="signet-application-date">
                      {app.jobTitle}
                      {appliedOn ? ` · Applied ${appliedOn}` : ""}
                    </span>
                  </div>
                  <span className={`signet-status ${statusClass(app.status)}`}>
                    {app.status || "Under Review"}
                  </span>
                </div>
              </Link>
            );
          })}
      </section>

      <section className="signet-dash-section">
        <div className="signet-section-head">
          <div>
            <h3>Recent postings</h3>
            <p>Your active and recent job listings</p>
          </div>
          <Link href="/company/jobs" className="signet-section-link">
            See all
          </Link>
        </div>

        {loading && <JobListShimmer count={3} />}

        {!loading && jobs.length === 0 && (
          <div className="signet-empty signet-panel">
            <h4>No jobs posted yet</h4>
            <p>Create your first vacancy to start receiving applications.</p>
            <Link href="/company/jobs/new" className="signet-btn mt-2">
              Post a job
            </Link>
          </div>
        )}

        {jobs.slice(0, 5).map((job) => (
          <JobCard
            key={job.id}
            job={job}
            href={`/company/applications?jobId=${job.id}`}
            showDescription={false}
            expandable={false}
            footer={
              <div className="signet-application-footer">
                <div className="signet-application-head">
                  <span className="signet-status">
                    {job.applicantsCount || 0} applicants · {job.status || "Active"}
                  </span>
                  <Link
                    href={`/company/jobs/${job.id}/edit`}
                    className="signet-btn secondary signet-btn-sm signet-btn-compact"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Edit
                  </Link>
                </div>
              </div>
            }
          />
        ))}
      </section>
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
