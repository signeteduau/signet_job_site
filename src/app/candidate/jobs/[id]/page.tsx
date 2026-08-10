"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import AuthGate from "@/app/components/signet/auth-gate";
import AppShell from "@/app/components/signet/app-shell";
import { PanelShimmer } from "@/app/components/signet/shimmer";
import { useAuth } from "@/context/auth-context";
import { fetchJobById } from "@/lib/services/jobs";
import { hasApplied } from "@/lib/services/applications";
import { isJobSaved, saveJob, unsaveJob } from "@/lib/services/saved-jobs";
import { openOrCreateChat } from "@/lib/services/chat";
import { Job } from "@/types/firestore";
import Wrapper from "@/layouts/wrapper";

function JobDetailInner() {
  const params = useParams();
  const id = String(params?.id || "");
  const router = useRouter();
  const { user, profile } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const j = await fetchJobById(id);
        setJob(j);
        if (user && j) {
          setSaved(await isJobSaved(user.uid, j.id));
          setApplied(await hasApplied(user.uid, j.id));
        }
      } catch {
        toast.error("Could not load job.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user]);

  if (loading) {
    return (
      <AppShell role="candidate" title="Job">
        <PanelShimmer rows={8} />
      </AppShell>
    );
  }

  if (!job) {
    return (
      <AppShell role="candidate" title="Job">
        <div className="signet-empty"><h4>Job not found</h4></div>
      </AppShell>
    );
  }

  return (
    <AppShell role="candidate" title={job.title}>
      <div className="signet-panel">
        <div className="d-flex gap-3 align-items-start mb-3">
          <div className="signet-logo-tile">
            {job.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={job.logoUrl} alt={job.companyName} />
            ) : (
              <span>{job.companyName?.charAt(0) || "S"}</span>
            )}
          </div>
          <div>
            <div className="signet-job-meta">
              <Link href={`/candidate/companies/${job.companyId}`} style={{ color: "#004CF0" }}>
                {job.companyName}
              </Link>
            </div>
            <div className="signet-tags mt-2">
              {job.type && <span>{job.type}</span>}
              {job.location && <span>{job.location}</span>}
              {job.salary && <span>{job.salary}</span>}
              {job.experience && <span>{job.experience}</span>}
              {job.category && <span>{job.category}</span>}
            </div>
          </div>
        </div>

        <h4 style={{ color: "#12141A", fontWeight: 700 }}>Description</h4>
        <p style={{ whiteSpace: "pre-wrap", color: "#6B7280" }}>
          {job.description || "No description provided."}
        </p>

        {job.rolesAndResponsibilities && (
          <>
            <h4 style={{ color: "#12141A", fontWeight: 700 }}>Roles & responsibilities</h4>
            <p style={{ whiteSpace: "pre-wrap", color: "#6B7280" }}>
              {job.rolesAndResponsibilities}
            </p>
          </>
        )}

        {!!job.skills?.length && (
          <>
            <h4 style={{ color: "#12141A", fontWeight: 700 }}>Skills</h4>
            <div className="signet-tags mb-3">
              {job.skills.map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>
          </>
        )}

        <div className="d-flex flex-wrap gap-2 mt-4">
          {applied ? (
            <button className="signet-btn secondary" disabled>
              Already applied
            </button>
          ) : (
            <Link href={`/candidate/jobs/${job.id}/apply`} className="signet-btn">
              Apply now
            </Link>
          )}
          <button
            className="signet-btn secondary"
            onClick={async () => {
              if (!user) return;
              try {
                if (saved) {
                  await unsaveJob(user.uid, job.id);
                  setSaved(false);
                } else {
                  await saveJob(user.uid, job);
                  setSaved(true);
                }
              } catch {
                toast.error("Could not update saved job.");
              }
            }}
          >
            {saved ? "Saved" : "Save job"}
          </button>
          <button
            className="signet-btn secondary"
            onClick={async () => {
              if (!user || !profile || !job.companyId) return;
              try {
                const chatId = await openOrCreateChat({
                  currentUser: profile,
                  otherUserId: job.companyId,
                });
                router.push(`/candidate/chat/${chatId}`);
              } catch {
                toast.error("Could not open chat.");
              }
            }}
          >
            Message company
          </button>
          <Link
            href={`/candidate/companies/${job.companyId}`}
            className="signet-btn secondary"
          >
            View company
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

export default function JobDetailPage() {
  return (
    <Wrapper>
      <AuthGate role="candidate">
        <JobDetailInner />
      </AuthGate>
    </Wrapper>
  );
}
