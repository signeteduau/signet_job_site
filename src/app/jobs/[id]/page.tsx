"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import JobCard from "@/app/components/signet/job-card";
import PublicSiteNav from "@/app/components/signet/public-site-nav";
import { JobCardShimmer, PanelShimmer } from "@/app/components/signet/shimmer";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { applyUrl } from "@/lib/auth-flow";
import { salarySuffix } from "@/lib/job-utils";
import { hasApplied } from "@/lib/services/applications";
import { fetchJobById } from "@/lib/services/jobs";
import { isJobSaved, saveJob, unsaveJob } from "@/lib/services/saved-jobs";
import { openOrCreateChat } from "@/lib/services/chat";
import { Job } from "@/types/firestore";
import Wrapper from "@/layouts/wrapper";

export default function PublicJobDetailPage() {
  const params = useParams();
  const id = String(params?.id || "");
  const router = useRouter();
  const { user, profile, isCandidateReady, requireAuth } = useRequireAuth();
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
          if (isCandidateReady) {
            setSaved(await isJobSaved(user.uid, j.id));
            setApplied(await hasApplied(user.uid, j.id));
          }
        } else {
          setSaved(false);
          setApplied(false);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user, isCandidateReady]);

  const handleApply = () => {
    if (
      !requireAuth({
        returnUrl: applyUrl(id),
        message: "Sign in to apply for this job",
        role: "candidate",
      })
    ) {
      return;
    }
    router.push(applyUrl(id));
  };

  const handleSave = async () => {
    if (
      !requireAuth({
        returnUrl: `/jobs/${id}`,
        message: "Sign in to save jobs",
        role: "candidate",
      })
    ) {
      return;
    }
    if (!user || !job) return;
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
  };

  const handleMessage = async () => {
    if (
      !requireAuth({
        returnUrl: `/jobs/${id}`,
        message: "Sign in to message the company",
        role: "candidate",
      })
    ) {
      return;
    }
    if (!profile || !job?.companyId) return;
    try {
      const chatId = await openOrCreateChat({
        currentUser: profile,
        otherUserId: job.companyId,
      });
      router.push(`/candidate/chat/${chatId}`);
    } catch {
      toast.error("Could not open chat.");
    }
  };

  return (
    <Wrapper>
      <div className="signet-site">
        <div className="signet-ambient" aria-hidden />
        <PublicSiteNav
          rightExtra={
            <Link href="/jobs" className="signet-ghost-btn d-none d-md-inline-flex">
              All jobs
            </Link>
          }
        />

        <main className="container" style={{ padding: "32px 16px 72px", maxWidth: 860 }}>
          {loading && (
            <>
              <JobCardShimmer />
              <PanelShimmer rows={6} />
            </>
          )}
          {!loading && !job && (
            <div className="signet-empty">
              <h4>Job not found</h4>
              <p>This role may have been closed or removed.</p>
              <Link href="/jobs" className="signet-btn mt-2">
                Browse jobs
              </Link>
            </div>
          )}
          {!loading && job && (
            <>
              <JobCard
                job={job}
                href={`/jobs/${job.id}`}
                showDescription={false}
                saved={saved}
                onSaveToggle={handleSave}
              />
              <div className="signet-panel">
                <h2 style={{ marginTop: 0, fontWeight: 850 }}>{job.title}</h2>
                <p style={{ color: "#6B7280" }}>
                  {job.companyName}
                  {job.location ? ` · ${job.location}` : ""}
                  {job.salary
                    ? ` · ${job.salary}${salarySuffix(job.salary) || ""}`
                    : ""}
                </p>
                <div className="signet-meta-chips mb-3">
                  {job.type && (
                    <span>
                      <i className="bi bi-briefcase" /> {job.type}
                    </span>
                  )}
                  {job.priority && (
                    <span>
                      <i className="bi bi-flag" /> {job.priority}
                    </span>
                  )}
                  {job.experience && (
                    <span>
                      <i className="bi bi-bar-chart" /> {job.experience}
                    </span>
                  )}
                </div>
                <h3 style={{ fontWeight: 800, fontSize: 18 }}>Description</h3>
                <p style={{ whiteSpace: "pre-wrap", color: "#374151", lineHeight: 1.7 }}>
                  {job.description || "No description provided."}
                </p>
                {job.rolesAndResponsibilities && (
                  <>
                    <h3 style={{ fontWeight: 800, fontSize: 18 }}>
                      Roles &amp; responsibilities
                    </h3>
                    <p style={{ whiteSpace: "pre-wrap", color: "#374151", lineHeight: 1.7 }}>
                      {job.rolesAndResponsibilities}
                    </p>
                  </>
                )}
                {!!job.skills?.length && (
                  <div className="signet-skill-chips mt-3">
                    {job.skills.map((s) => (
                      <span key={s}>{s}</span>
                    ))}
                  </div>
                )}
                {job.attachmentUrl && (
                  <a
                    href={job.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="signet-btn secondary mt-3"
                  >
                    View attachment
                  </a>
                )}
                <div className="d-flex flex-wrap gap-2 mt-4">
                  {applied ? (
                    <button className="signet-btn secondary" disabled>
                      Already applied
                    </button>
                  ) : (
                    <button type="button" className="signet-btn" onClick={handleApply}>
                      Apply now
                    </button>
                  )}
                  <button type="button" className="signet-btn secondary" onClick={handleSave}>
                    {saved ? "Saved" : "Save job"}
                  </button>
                  <button type="button" className="signet-btn secondary" onClick={handleMessage}>
                    Message company
                  </button>
                </div>
                {!isCandidateReady && (
                  <p className="mt-3 mb-0" style={{ color: "#6B7280", fontSize: 14 }}>
                    Browse freely — sign in only when you apply, save, or message.
                  </p>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </Wrapper>
  );
}
