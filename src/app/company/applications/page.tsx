"use client";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import AuthGate from "@/app/components/signet/auth-gate";
import AppShell from "@/app/components/signet/app-shell";
import { PageLoader } from "@/app/components/signet/shimmer";
import { useAuth } from "@/context/auth-context";
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

  useEffect(() => {
    (async () => {
      if (!jobId) {
        setApps([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const list = await fetchJobApplications(jobId);
        setApps(list);
        const entries = await Promise.all(
          list.map(async (a) => {
            const id = a.userId || a.id;
            const p = await getUserProfile(id);
            return [id, p?.fullName || id] as const;
          })
        );
        setNames(Object.fromEntries(entries));
      } catch {
        toast.error("Could not load applications.");
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId]);

  const selectedJob = useMemo(
    () => jobs.find((j) => j.id === jobId),
    [jobs, jobId]
  );

  const filteredApps = useMemo(() => {
    if (!statusFilter) return apps;
    return apps.filter(
      (a) => (a.status || "").toLowerCase() === statusFilter.toLowerCase()
    );
  }, [apps, statusFilter]);

  return (
    <AppShell role="company" title="Applications">
      <div className="row">
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
              <option value="Applied">Applied</option>
              <option value="Under Review">Under Review</option>
              <option value="Interview Scheduled">Interview Scheduled</option>
              <option value="Hired">Hired</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div className="signet-panel" aria-busy="true">
          {[1, 2, 3].map((i) => (
            <div key={i} className="mb-3">
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

      {filteredApps.map((app) => {
        const applicantId = app.userId || app.id;
        return (
          <div key={app.id} className="signet-panel">
            <div className="d-flex justify-content-between gap-2 flex-wrap">
              <div>
                <div style={{ color: "#12141A", fontWeight: 700 }}>
                  {names[applicantId] || applicantId}
                </div>
                <div style={{ color: "#6B7280", fontSize: 13 }}>
                  {app.phone || "No phone"} · {app.resumeFile || "Resume"}
                </div>
                <span
                  className={`signet-status mt-2 ${
                    app.status === "Rejected"
                      ? "rejected"
                      : app.status === "Interview Scheduled"
                      ? "interview"
                      : ""
                  }`}
                >
                  {app.status}
                </span>
              </div>
              <div className="d-flex flex-column gap-2">
                <Link
                  href={`/company/applications/${jobId}/${applicantId}`}
                  className="signet-btn"
                >
                  View details
                </Link>
                {app.resumeUrl && (
                  <a
                    href={app.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="signet-btn secondary"
                  >
                    View resume
                  </a>
                )}
                <button
                  className="signet-btn secondary"
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
                <button
                  className="signet-btn secondary"
                  onClick={async () => {
                    if (!user || !jobId) return;
                    try {
                      await updateApplicationStatus({
                        jobId,
                        companyId: user.uid,
                        applicantId,
                        status: "Interview Scheduled",
                      });
                      toast.success("Interview scheduled.");
                      setApps(await fetchJobApplications(jobId));
                    } catch {
                      toast.error("Update failed.");
                    }
                  }}
                >
                  Schedule interview
                </button>
                <button
                  className="signet-btn"
                  onClick={async () => {
                    if (!user || !jobId) return;
                    try {
                      await updateApplicationStatus({
                        jobId,
                        companyId: user.uid,
                        applicantId,
                        status: "Hired",
                      });
                      toast.success("Marked as hired.");
                      setApps(await fetchJobApplications(jobId));
                    } catch {
                      toast.error("Update failed.");
                    }
                  }}
                >
                  Hire
                </button>
                <button
                  className="signet-btn danger"
                  onClick={async () => {
                    if (!user || !jobId) return;
                    try {
                      await updateApplicationStatus({
                        jobId,
                        companyId: user.uid,
                        applicantId,
                        status: "Rejected",
                        rejectionReason: "Not a fit at this time",
                      });
                      toast.success("Application rejected.");
                      setApps(await fetchJobApplications(jobId));
                    } catch {
                      toast.error("Update failed.");
                    }
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        );
      })}
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
