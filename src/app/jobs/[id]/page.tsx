"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import PublicSiteNav from "@/app/components/signet/public-site-nav";
import { PanelShimmer } from "@/app/components/signet/shimmer";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { applyUrl } from "@/lib/auth-flow";
import { formatMissingList, getProfileCompletion } from "@/lib/profile-completion";
import { isSignetJob, jobEmployerLabel, normalizeJobType, parseJobDescriptionSections, salarySuffix, showJobEmployer } from "@/lib/job-utils";
import JobDescriptionBlocks from "@/app/components/signet/job-description-blocks";
import { hasApplied } from "@/lib/services/applications";
import { fetchJobById, fetchRelatedJobs } from "@/lib/services/jobs";
import { isJobSaved, saveJob, unsaveJob } from "@/lib/services/saved-jobs";
import { openOrCreateChat } from "@/lib/services/chat";
import { Job } from "@/types/firestore";
import Wrapper from "@/layouts/wrapper";

function relatedJobTypeLabel(type?: string) {
  const normalized = normalizeJobType(type);
  if (!normalized) return "Full time";
  if (normalized.includes("part")) return "Part time";
  if (normalized.includes("contract")) return "Contract";
  if (normalized.includes("trainee")) return "Trainee";
  if (normalized.includes("intern")) return "Internship";
  if (normalized.includes("remote")) return "Remote";
  return type || "Full time";
}

function relatedLocationLabel(job: Job) {
  const normalized = normalizeJobType(job.type);
  if (normalized.includes("remote") || /anywhere|remote/i.test(job.location || "")) {
    return "Remote";
  }
  return job.location?.split(",")[0]?.trim() || "Flexible";
}

function relatedSalaryLabel(job: Job) {
  if (!job.salary) return "Salary TBD";
  const suffix = salarySuffix(job.salary);
  return suffix ? `${job.salary}${suffix}` : job.salary;
}

export default function PublicJobDetailPage() {
  const params = useParams();
  const id = String(params?.id || "");
  const router = useRouter();
  const { user, profile, isCandidateReady, requireAuth } = useRequireAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [relatedJobs, setRelatedJobs] = useState<Job[]>([]);
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setJob(null);
    (async () => {
      try {
        const j = await fetchJobById(id);
        if (alive) setJob(j);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    if (!job) {
      setRelatedJobs([]);
      setRelatedLoading(false);
      return;
    }
    let alive = true;
    setRelatedLoading(true);
    fetchRelatedJobs(job, 5)
      .then((list) => {
        if (alive) setRelatedJobs(list);
      })
      .finally(() => {
        if (alive) setRelatedLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [job]);

  useEffect(() => {
    if (!user || !job || !isCandidateReady) {
      setSaved(false);
      setApplied(false);
      return;
    }
    let alive = true;
    Promise.all([isJobSaved(user.uid, job.id), hasApplied(user.uid, job.id)]).then(
      ([isSaved, hasApp]) => {
        if (alive) {
          setSaved(isSaved);
          setApplied(hasApp);
        }
      }
    );
    return () => {
      alive = false;
    };
  }, [user, job, isCandidateReady]);

  const applyMissing = getProfileCompletion(profile).applyMissing;
  const signetRole = job ? isSignetJob(job) : false;
  const employerLabel = job ? jobEmployerLabel(job) : "";
  const showEmployer = job ? showJobEmployer(job) : false;
  const salaryLabel = useMemo(() => {
    if (!job?.salary) return "Salary TBD";
    const suffix = salarySuffix(job.salary);
    return suffix ? `${job.salary}${suffix}` : job.salary;
  }, [job]);
  const descHasHeadings = useMemo(
    () => parseJobDescriptionSections(job?.description).some((s) => s.heading),
    [job?.description]
  );
  const showRolesBlock = Boolean(
    job?.rolesAndResponsibilities?.trim() &&
      job.rolesAndResponsibilities.trim() !== (job.description || "").trim()
  );

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

        <main className="container signet-job-detail-layout">
          {loading && (
            <>
              <div className="signet-job-detail-main">
                <PanelShimmer rows={8} />
              </div>
              <aside className="signet-job-detail-sidebar" aria-hidden>
                <PanelShimmer rows={5} />
              </aside>
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
              <article className="signet-job-detail-main signet-panel">
                <h1 className="signet-job-detail-title">{job.title}</h1>

                <div className="signet-job-meta signet-job-detail-meta">
                  {showEmployer && (
                    <span className="signet-job-meta-item">
                      <i className="bi bi-building" aria-hidden />
                      <strong>{employerLabel}</strong>
                    </span>
                  )}
                  {signetRole && job.category && (
                    <span className="signet-job-meta-item">
                      <i className="bi bi-mortarboard" aria-hidden />
                      <strong>{job.category}</strong>
                    </span>
                  )}
                  {job.location && (
                    <span className="signet-job-meta-item">
                      <i className="bi bi-geo-alt" aria-hidden />
                      {job.location}
                    </span>
                  )}
                  <span className="signet-job-meta-item">
                    <i className="bi bi-cash-stack" aria-hidden />
                    {salaryLabel}
                  </span>
                </div>

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

                {!descHasHeadings && (
                  <h3 className="signet-job-detail-section-title">Description</h3>
                )}
                <JobDescriptionBlocks text={job.description} />
                {showRolesBlock && (
                  <>
                    {!descHasHeadings && (
                      <h3 className="signet-job-detail-section-title">
                        Roles &amp; responsibilities
                      </h3>
                    )}
                    <JobDescriptionBlocks text={job.rolesAndResponsibilities} />
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
                  {!signetRole && (
                    <button type="button" className="signet-btn secondary" onClick={handleMessage}>
                      Message company
                    </button>
                  )}
                </div>
                {profile?.userType === "candidate" && applyMissing.length > 0 ? (
                  <p className="signet-job-detail-note">
                    To apply, add {formatMissingList(applyMissing)} to your profile.
                  </p>
                ) : !isCandidateReady ? (
                  <p className="signet-job-detail-note">
                    Browse freely — sign in only when you apply, save, or message.
                  </p>
                ) : null}
              </article>

              <aside className="signet-job-detail-sidebar">
                <div className="signet-related-jobs">
                  <div className="signet-related-jobs-head">
                    <h3>Related jobs</h3>
                    {!relatedJobs.length ? (
                      <p>Browse similar roles</p>
                    ) : (
                      <p>{relatedJobs.length} similar role{relatedJobs.length === 1 ? "" : "s"}</p>
                    )}
                  </div>
                  {relatedLoading && (
                    <p className="signet-related-jobs-empty">Loading similar roles…</p>
                  )}
                  {!relatedLoading && relatedJobs.length === 0 && (
                    <p className="signet-related-jobs-empty">
                      No similar roles right now.
                    </p>
                  )}
                  <div className="signet-related-jobs-list">
                    {relatedJobs.map((related) => {
                      const logo = related.logoUrl || "";
                      const relatedSignet = isSignetJob(related);
                      const relatedEmployer = jobEmployerLabel(related);
                      const initial = (relatedSignet ? "S" : related.companyName || "S")
                        .charAt(0)
                        .toUpperCase();
                      const typeLabel = relatedJobTypeLabel(related.type);
                      const categoryTag =
                        related.category?.trim() || typeLabel;
                      const isGrant = /grant/i.test(categoryTag);
                      return (
                        <Link
                          key={related.id}
                          href={`/jobs/${related.id}`}
                          className="signet-related-job"
                        >
                          <div className="signet-related-job-top">
                            <span className="signet-related-job-logo">
                              {logo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={logo} alt="" />
                              ) : (
                                <span>{initial}</span>
                              )}
                            </span>
                            <span
                              className={`signet-related-job-tag ${
                                isGrant ? "is-grant" : ""
                              }`}
                            >
                              {categoryTag}
                            </span>
                          </div>
                          <strong className="signet-related-job-title">
                            {related.title}
                          </strong>
                          <div className="signet-related-job-meta">
                            {!relatedSignet && relatedEmployer && (
                              <span>
                                <i className="bi bi-building" aria-hidden />
                                {relatedEmployer}
                              </span>
                            )}
                            {relatedSignet && related.category && (
                              <span>
                                <i className="bi bi-mortarboard" aria-hidden />
                                {related.category}
                              </span>
                            )}
                            <span>
                              <i className="bi bi-geo-alt" aria-hidden />
                              {relatedLocationLabel(related)}
                            </span>
                          </div>
                          <div className="signet-related-job-foot">
                            <span
                              className={`signet-related-job-salary ${
                                related.salary ? "" : "is-muted"
                              }`}
                            >
                              {relatedSalaryLabel(related)}
                            </span>
                            <span className="signet-related-job-arrow" aria-hidden>
                              <i className="bi bi-arrow-right" />
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </aside>
            </>
          )}
        </main>
      </div>
    </Wrapper>
  );
}
