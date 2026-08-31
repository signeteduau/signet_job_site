"use client";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import AuthGate from "@/app/components/signet/auth-gate";
import AppShell from "@/app/components/signet/app-shell";
import { PageLoader } from "@/app/components/signet/shimmer";
import { useAuth } from "@/context/auth-context";
import { formatAppliedDate } from "@/lib/job-utils";
import { fetchCompanyJobs } from "@/lib/services/jobs";
import {
  fetchJobApplications,
  updateApplicationStatus,
} from "@/lib/services/applications";
import { openOrCreateChat } from "@/lib/services/chat";
import { getUserProfile } from "@/lib/services/users";
import { Application, Job } from "@/types/firestore";
import Wrapper from "@/layouts/wrapper";
import Link from "next/link";
import { useRouter } from "next/navigation";

function statusClass(status?: string) {
  if (status === "Rejected") return "rejected";
  if (status === "Interview Scheduled") return "interview";
  if (status === "Hired") return "hired";
  return "";
}

function applicantInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function ApplicationsInner() {
  const { user, profile } = useAuth();
  const search = useSearchParams();
  const router = useRouter();
  const preselect = search?.get("jobId") || "";
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobId, setJobId] = useState(preselect);
  const [apps, setApps] = useState<Application[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        const list = await fetchCompanyJobs(user.uid);
        setJobs(list);
        if (!jobId && list[0]) setJobId(list[0].id);
      } catch {
        toast.error("Could not load jobs.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const reloadApps = async (nextJobId: string) => {
    const list = await fetchJobApplications(nextJobId);
    setApps(list);
    const entries = await Promise.all(
      list.map(async (a) => {
        const id = a.userId || a.id;
        const p = await getUserProfile(id);
        return [id, p?.fullName || id] as const;
      })
    );
    setNames(Object.fromEntries(entries));
  };

  useEffect(() => {
    (async () => {
      if (!jobId) {
        setApps([]);
        setNames({});
        setLoading(false);
        return;
      }
      setLoading(true);
      setApps([]);
      try {
        await reloadApps(jobId);
      } catch {
        toast.error("Could not load applications.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const selectedJob = useMemo(
    () => jobs.find((j) => j.id === jobId),
    [jobs, jobId]
  );

  const filteredApps = useMemo(() => {
    if (!statusFilter) return apps;
    return apps.filter(
      (a) => (a.status || "Under Review").toLowerCase() === statusFilter.toLowerCase()
    );
  }, [apps, statusFilter]);

  const updateStatus = async (
    applicantId: string,
    status: Application["status"],
    rejectionReason?: string
  ) => {
    if (!user || !jobId) return;
    try {
      await updateApplicationStatus({
        jobId,
        companyId: user.uid,
        applicantId,
        status: status!,
        rejectionReason,
      });
      toast.success("Application updated.");
      await reloadApps(jobId);
    } catch {
      toast.error("Update failed.");
    }
  };

  return (
    <AppShell
      role="company"
      title="Applications"
      subtitle={
        selectedJob
          ? `${filteredApps.length} applicant${filteredApps.length === 1 ? "" : "s"} for ${selectedJob.title}`
          : "Review candidates who applied to your roles"
      }
    >
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <div className="signet-field">
            <label>Job</label>
            <select value={jobId} onChange={(e) => setJobId(e.target.value)}>
              {jobs.length === 0 && <option value="">No jobs</option>}
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="col-md-6">
          <div className="signet-field">
            <label>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="Under Review">Under Review</option>
              <option value="Interview Scheduled">Interview Scheduled</option>
              <option value="Hired">Hired</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div className="signet-company-apps" aria-busy="true">
          {[1, 2, 3].map((i) => (
            <div key={i} className="signet-company-app-card">
              <span className="signet-shimmer sk-line sk-w-40 d-block mb-2" style={{ height: 16 }} />
              <span className="signet-shimmer sk-line sk-w-70 d-block" />
            </div>
          ))}
        </div>
      )}

      {!loading && apps.length === 0 && (
        <div className="signet-empty">
          <h4>No applications</h4>
          <p>
            {selectedJob
              ? "No one has applied to this role yet."
              : "Post a job to start receiving applications."}
          </p>
        </div>
      )}

      {!loading && apps.length > 0 && filteredApps.length === 0 && (
        <div className="signet-empty">
          <h4>No matches</h4>
          <p>No applications with this status.</p>
        </div>
      )}

      {!loading && filteredApps.length > 0 && (
        <div className="signet-company-apps">
          {filteredApps.map((app) => {
            const applicantId = app.userId || app.id;
            const name = names[applicantId] || "Applicant";
            const appliedOn = formatAppliedDate(app.appliedAt);
            return (
              <article key={app.id} className="signet-company-app-card">
                <div className="signet-company-app-header">
                  <div className="signet-company-app-main">
                    <span className="signet-company-app-avatar" aria-hidden>
                      {applicantInitials(name)}
                    </span>
                    <div className="signet-company-app-meta">
                      <strong>{name}</strong>
                      <span className="signet-company-app-sub">
                        {app.phone || "No phone on file"}
                        {appliedOn ? ` · Applied ${appliedOn}` : ""}
                      </span>
                      <span className={`signet-status ${statusClass(app.status)}`}>
                        {app.status || "Under Review"}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/company/applications/${jobId}/${applicantId}`}
                    className="signet-btn signet-btn-compact signet-company-app-profile"
                  >
                    View profile
                  </Link>
                </div>

                <div className="signet-company-app-actions">
                  {app.resumeUrl && (
                    <a
                      href={app.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="signet-btn secondary signet-btn-compact"
                    >
                      Resume
                    </a>
                  )}
                  <button
                    type="button"
                    className="signet-btn secondary signet-btn-compact"
                    onClick={async () => {
                      if (!user || !profile) return;
                      try {
                        const chatId = await openOrCreateChat({
                          currentUser: profile,
                          otherUserId: applicantId,
                        });
                        router.push(`/company/chat/${chatId}`);
                      } catch {
                        toast.error("Could not open chat.");
                      }
                    }}
                  >
                    Message
                  </button>
                  {app.status !== "Interview Scheduled" && app.status !== "Hired" && (
                    <button
                      type="button"
                      className="signet-btn secondary signet-btn-compact"
                      onClick={() => updateStatus(applicantId, "Interview Scheduled")}
                    >
                      Interview
                    </button>
                  )}
                  {app.status !== "Hired" && (
                    <button
                      type="button"
                      className="signet-btn signet-btn-compact"
                      onClick={() => updateStatus(applicantId, "Hired")}
                    >
                      Hire
                    </button>
                  )}
                  {app.status !== "Rejected" && (
                    <button
                      type="button"
                      className="signet-btn danger signet-btn-compact"
                      onClick={() =>
                        updateStatus(applicantId, "Rejected", "Not a fit at this time")
                      }
                    >
                      Reject
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

export default function CompanyApplicationsPage() {
  return (
    <Wrapper>
      <AuthGate role="company">
        <Suspense fallback={<PageLoader label="Loading applications…" />}>
          <ApplicationsInner />
        </Suspense>
      </AuthGate>
    </Wrapper>
  );
}
