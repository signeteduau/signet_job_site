"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import AuthGate from "@/app/components/signet/auth-gate";
import AppShell from "@/app/components/signet/app-shell";
import JobCard from "@/app/components/signet/job-card";
import { JobListShimmer } from "@/app/components/signet/shimmer";
import { useAuth } from "@/context/auth-context";
import {
  fetchUserApplications,
  withdrawApplication,
} from "@/lib/services/applications";
import { fetchSavedJobs, unsaveJob } from "@/lib/services/saved-jobs";
import {
  fetchFollowedCompanies,
  FollowedCompany,
  unfollowCompany,
} from "@/lib/services/companies";
import { formatAppliedDate } from "@/lib/job-utils";
import { Application, SavedJob } from "@/types/firestore";
import Wrapper from "@/layouts/wrapper";

function MyJobsInner() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"saved" | "applied" | "following">("applied");
  const [saved, setSaved] = useState<SavedJob[]>([]);
  const [applied, setApplied] = useState<Application[]>([]);
  const [following, setFollowing] = useState<FollowedCompany[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [s, a, f] = await Promise.all([
        fetchSavedJobs(user.uid),
        fetchUserApplications(user.uid),
        fetchFollowedCompanies(user.uid),
      ]);
      setSaved(s);
      setApplied(a);
      setFollowing(f);
    } catch {
      toast.error("Could not load your jobs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <AppShell role="candidate" title="My Jobs">
      <div className="d-flex gap-2 mb-4 flex-wrap">
        <button
          className={`signet-btn ${tab === "applied" ? "" : "secondary"}`}
          onClick={() => setTab("applied")}
        >
          Applied ({applied.length})
        </button>
        <button
          className={`signet-btn ${tab === "saved" ? "" : "secondary"}`}
          onClick={() => setTab("saved")}
        >
          Saved ({saved.length})
        </button>
        <button
          className={`signet-btn ${tab === "following" ? "" : "secondary"}`}
          onClick={() => setTab("following")}
        >
          Following ({following.length})
        </button>
      </div>

      {loading && <JobListShimmer count={4} />}

      {!loading && tab === "applied" && applied.length === 0 && (
        <div className="signet-empty">
          <h4>No applications yet</h4>
          <p>Browse jobs and apply to get started.</p>
          <Link href="/jobs" className="signet-btn mt-2">
            Browse jobs
          </Link>
        </div>
      )}
      {!loading &&
        tab === "applied" &&
        applied.map((app) => {
          const appliedOn = formatAppliedDate(app.appliedAt);
          return (
            <JobCard
              key={app.id}
              job={{
                id: app.jobId,
                jobId: app.jobId,
                companyId: app.companyId,
                companyName: app.companyName,
                title: app.title,
                location: app.location || "",
                type: app.type || "",
                salary: app.salary || "",
                logoUrl: app.logoUrl,
              }}
              showDescription={false}
              footer={
                <div className="w-100">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
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
                    {appliedOn && (
                      <span style={{ color: "#6B7280", fontSize: 12 }}>
                        Applied {appliedOn}
                      </span>
                    )}
                  </div>
                  {app.status === "Interview Scheduled" &&
                    (app.interviewDate || app.interviewTime) && (
                      <p className="mb-2" style={{ color: "#0E7490", fontSize: 13, fontWeight: 650 }}>
                        Interview: {[app.interviewDate, app.interviewTime]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  {app.status === "Rejected" && app.rejectionReason && (
                    <p className="mb-2" style={{ color: "#DC2626", fontSize: 13 }}>
                      {app.rejectionReason}
                    </p>
                  )}
                  <button
                    className="signet-btn danger"
                    onClick={async () => {
                      if (!user) return;
                      if (
                        !window.confirm(
                          "Withdraw this application? This cannot be undone."
                        )
                      ) {
                        return;
                      }
                      try {
                        await withdrawApplication(
                          user.uid,
                          app.jobId,
                          app.companyId
                        );
                        toast.success("Application withdrawn.");
                        load();
                      } catch {
                        toast.error("Could not withdraw.");
                      }
                    }}
                  >
                    Withdraw
                  </button>
                </div>
              }
            />
          );
        })}

      {!loading && tab === "saved" && saved.length === 0 && (
        <div className="signet-empty">
          <h4>No saved jobs</h4>
          <p>Tap the bookmark on a job to save it.</p>
        </div>
      )}
      {!loading &&
        tab === "saved" &&
        saved.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            saved
            onSaveToggle={async () => {
              if (!user) return;
              await unsaveJob(user.uid, job.jobId);
              load();
            }}
          />
        ))}

      {!loading && tab === "following" && following.length === 0 && (
        <div className="signet-empty">
          <h4>Not following any companies</h4>
          <p>Open a company page and tap Follow.</p>
        </div>
      )}
      {!loading &&
        tab === "following" &&
        following.map((c) => (
          <div
            key={c.id}
            className="signet-panel d-flex align-items-center gap-3"
          >
            <div className="signet-logo-tile">
              {c.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.logoUrl} alt={c.companyName} />
              ) : (
                <span>{(c.companyName || "C").charAt(0)}</span>
              )}
            </div>
            <div className="flex-grow-1">
              <Link
                href={`/candidate/companies/${c.companyId}`}
                className="signet-job-title"
              >
                {c.companyName}
              </Link>
            </div>
            <button
              className="signet-btn secondary"
              onClick={async () => {
                if (!user) return;
                await unfollowCompany(user.uid, c.companyId);
                load();
              }}
            >
              Unfollow
            </button>
          </div>
        ))}
    </AppShell>
  );
}

export default function MyJobsPage() {
  return (
    <Wrapper>
      <AuthGate role="candidate">
        <MyJobsInner />
      </AuthGate>
    </Wrapper>
  );
}
