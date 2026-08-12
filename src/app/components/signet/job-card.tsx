"use client";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Job, SavedJob } from "@/types/firestore";
import { useRequireAuth } from "@/hooks/use-require-auth";
import {
  formatPostedAgo,
  isJobNew,
  normalizeJobType,
  salarySuffix,
} from "@/lib/job-utils";

type Props = {
  job: Job | SavedJob;
  href?: string;
  onSaveToggle?: () => void;
  saved?: boolean;
  footer?: React.ReactNode;
  showDescription?: boolean;
  expandable?: boolean;
};

function cityOnly(location?: string) {
  if (!location) return "";
  return location.split(",")[0]?.trim() || location;
}

function workLocationLabel(location?: string, type?: string) {
  const normalized = normalizeJobType(type);
  if (normalized.includes("remote") || /anywhere|remote/i.test(location || "")) {
    return "Remote";
  }
  return cityOnly(location) || "Flexible";
}

function typeLabel(type?: string) {
  const normalized = normalizeJobType(type);
  if (!normalized) return "Full time";
  if (normalized.includes("part")) return "Part time";
  if (normalized.includes("contract")) return "Contract";
  if (normalized.includes("intern")) return "Internship";
  if (normalized.includes("remote")) return "Remote";
  return type || "Full time";
}

export default function JobCard({
  job,
  href,
  onSaveToggle,
  saved,
  footer,
  showDescription = true,
  expandable = true,
}: Props) {
  const router = useRouter();
  const { requireAuth } = useRequireAuth();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const link = href || `/jobs/${job.id || (job as SavedJob).jobId}`;
  const isPublicJobView = link.includes("/jobs/");
  const showMessaging = isPublicJobView;
  const logo =
    job.logoUrl ||
    (job as Job & { profileImage?: string }).profileImage ||
    "";
  const initial = (job.companyName || "S").charAt(0).toUpperCase();
  const location = workLocationLabel(job.location, job.type);
  const rolesAndResponsibilities =
    "rolesAndResponsibilities" in job ? job.rolesAndResponsibilities : "";
  const description = (job.description || rolesAndResponsibilities || "")
    .replace(/\s+/g, " ")
    .trim();
  const showDesc =
    showDescription &&
    description &&
    description.toLowerCase() !== "nothing" &&
    description.toLowerCase() !== "n/a";
  const skills = (job.skills || [])
    .map((s) => String(s).trim())
    .filter(Boolean)
    .slice(0, 4);
  const postedAt =
    "createdAt" in job && job.createdAt
      ? job.createdAt
      : "timestamp" in job
      ? job.timestamp
      : undefined;
  const postedAgo = formatPostedAgo(postedAt);
  const postedShort = postedAgo.replace(/^Posted /, "");
  const isNew = isJobNew(postedAt);
  const categoryTag =
    ("category" in job ? job.category : undefined) || job.type || "Open role";
  const isGrant = /grant/i.test(categoryTag);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return link;
    return `${window.location.origin}${link}`;
  }, [link]);

  const open = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    router.push(link);
  };

  const copyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied!");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link.");
    }
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((v) => !v);
  };

  return (
    <article
      className={`signet-job-card ${expanded ? "is-expanded" : ""} ${isNew ? "is-new" : ""}`}
    >
      <div className="signet-job-card-inner">
        <div className="signet-job-row">
          <div className="signet-job-logo">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" />
            ) : (
              <span>{initial}</span>
            )}
          </div>

          <div className="signet-job-body">
            <div className="signet-job-topline">
              <div className="signet-job-info">
                <div className="signet-job-tags">
                  <span
                    className={`signet-job-tag ${isGrant ? "grant" : "role"}`}
                  >
                    {categoryTag}
                  </span>
                  {isNew && <span className="signet-job-new">New</span>}
                </div>

                <h3 className="signet-job-title">{job.title}</h3>

                <div className="signet-job-meta">
                  <span className="signet-job-meta-item">
                    <i className="bi bi-building" aria-hidden />
                    <strong>{job.companyName || "Company"}</strong>
                  </span>
                  <span className="signet-job-meta-item">
                    <i className="bi bi-geo-alt" aria-hidden />
                    {location}
                  </span>
                  <span className="signet-job-meta-item">
                    <i className="bi bi-briefcase" aria-hidden />
                    {typeLabel(job.type)}
                  </span>
                  {postedShort && (
                    <span className="signet-job-meta-item">
                      <i className="bi bi-clock" aria-hidden />
                      {postedShort}
                    </span>
                  )}
                </div>
              </div>

              <div className="signet-job-actions-col">
                <div className="signet-job-salary">
                  {job.salary ? (
                    <strong>
                      {job.salary}
                      {salarySuffix(job.salary) && (
                        <span className="signet-job-salary-period">
                          {" / "}
                          {salarySuffix(job.salary)!.replace(/^\//, "")}
                        </span>
                      )}
                    </strong>
                  ) : (
                    <strong className="muted">Salary TBD</strong>
                  )}
                </div>

                <div className="signet-job-icon-actions">
                  <button
                    type="button"
                    className="signet-job-icon-btn"
                    aria-label="Share job"
                    onClick={copyLink}
                  >
                    <i className="bi bi-share" />
                  </button>
                  {showMessaging && (
                    <button
                      type="button"
                      className="signet-job-icon-btn"
                      aria-label="Message"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          !requireAuth({
                            returnUrl: link,
                            message: "Sign in to message",
                            role: "candidate",
                          })
                        ) {
                          return;
                        }
                        router.push("/candidate/chat");
                      }}
                    >
                      <i className="bi bi-chat" />
                    </button>
                  )}
                  {(onSaveToggle || isPublicJobView) && (
                    <button
                      type="button"
                      className={`signet-job-icon-btn ${saved ? "active" : ""}`}
                      aria-label={saved ? "Unsave" : "Save"}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSaveToggle) {
                          onSaveToggle();
                          return;
                        }
                        requireAuth({
                          returnUrl: link,
                          message: "Sign in to save jobs",
                          role: "candidate",
                        });
                      }}
                    >
                      <i className={`bi ${saved ? "bi-star-fill" : "bi-star"}`} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {skills.length > 0 && (
              <div className="signet-job-skills">
                {skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            )}

            <div className="signet-job-footer">
              {expandable && showDesc ? (
                <button
                  type="button"
                  className="signet-job-expand-btn"
                  aria-expanded={expanded}
                  onClick={toggleExpand}
                >
                  {expanded ? "Hide details" : "Expand details"}
                  <i
                    className={`bi bi-chevron-${expanded ? "up" : "down"}`}
                    aria-hidden
                  />
                </button>
              ) : (
                <span />
              )}
              <button type="button" className="signet-job-cta" onClick={open}>
                View job
                <i className="bi bi-arrow-right" aria-hidden />
              </button>
            </div>
          </div>
        </div>

        {expandable && showDesc && (
          <div className={`signet-job-details ${expanded ? "open" : ""}`}>
            <div className="signet-job-details-wrap">
              <p className="signet-job-details-text">{description}</p>
              <div className="signet-job-details-meta">
                {"experience" in job && job.experience && (
                  <span>{job.experience} experience</span>
                )}
                <button
                  type="button"
                  className="signet-job-copy-link"
                  onClick={copyLink}
                >
                  {copied ? "Copied!" : "Copy link"}
                </button>
              </div>
              {isGrant && (
                <p className="signet-job-grant-note">
                  Grants are not eligible for referral bonuses at this time.
                </p>
              )}
            </div>
          </div>
        )}

        {!expandable && showDesc && (
          <p className="signet-job-desc">{description}</p>
        )}

        {footer && (
          <div
            className="signet-job-extra"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {footer}
          </div>
        )}
      </div>
    </article>
  );
}
