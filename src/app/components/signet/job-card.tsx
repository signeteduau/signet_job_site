"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Job, SavedJob } from "@/types/firestore";
import { salarySuffix } from "@/lib/job-utils";

type Props = {
  job: Job | SavedJob;
  href?: string;
  onSaveToggle?: () => void;
  saved?: boolean;
  footer?: React.ReactNode;
  showDescription?: boolean;
};

function cityOnly(location?: string) {
  if (!location) return "";
  return location.split(",")[0]?.trim() || location;
}

function priorityClass(priority?: string) {
  const p = (priority || "").toLowerCase();
  if (p === "high") return "priority-high";
  if (p === "medium") return "priority-medium";
  return "priority-low";
}

export default function JobCard({
  job,
  href,
  onSaveToggle,
  saved,
  footer,
  showDescription = true,
}: Props) {
  const router = useRouter();
  const link = href || `/candidate/jobs/${job.id || (job as SavedJob).jobId}`;
  const logo =
    job.logoUrl ||
    (job as Job & { profileImage?: string }).profileImage ||
    "";
  const initial = (job.companyName || "S").charAt(0).toUpperCase();
  const location = cityOnly(job.location);
  const description = (job.description || "").replace(/\s+/g, " ").trim();
  const showDesc =
    showDescription &&
    description &&
    description.toLowerCase() !== "nothing" &&
    description.toLowerCase() !== "n/a";
  const tone = priorityClass(job.priority);
  const skills = ((job as Job).skills || [])
    .map((s) => String(s).trim())
    .filter(Boolean)
    .slice(0, 3);

  const open = () => router.push(link);

  return (
    <article
      className={`signet-job-card ${tone}`}
      role="link"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
    >
      <span className="signet-job-accent" aria-hidden />
      <div className="signet-job-card-inner">
        <div className="signet-job-top">
          <div className="signet-logo-frame" aria-hidden>
            <div className="signet-logo-tile">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ lineHeight: 1 }}>{initial}</span>
              )}
            </div>
          </div>

          <div className="signet-job-heading">
            <div className="signet-job-kicker">
              <span className="company">
                <i className="bi bi-buildings" />
                {job.companyName || "Company"}
              </span>
            </div>
            <h3 className="signet-job-title">{job.title}</h3>
          </div>

          {onSaveToggle && (
            <button
              type="button"
              className={`signet-icon-btn ${saved ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onSaveToggle();
              }}
              aria-label={saved ? "Unsave" : "Save"}
            >
              <i className={`bi ${saved ? "bi-bookmark-fill" : "bi-bookmark"}`} />
            </button>
          )}
        </div>

        {showDesc && <p className="signet-job-desc">{description}</p>}

        <div className="signet-meta-chips">
          {job.type && (
            <span>
              <i className="bi bi-briefcase" /> {job.type}
            </span>
          )}
          {location && (
            <span>
              <i className="bi bi-geo-alt" /> {location}
            </span>
          )}
          {job.priority && (
            <span className={tone}>
              <i className="bi bi-flag" /> {job.priority}
            </span>
          )}
        </div>

        {skills.length > 0 && (
          <div className="signet-skill-chips">
            {skills.map((skill) => (
              <span key={skill}>{skill}</span>
            ))}
          </div>
        )}

        <div className="signet-job-footer">
          {job.salary ? (
            <div className="signet-salary">
              <i className="bi bi-cash-coin" />
              <strong>{job.salary}</strong>
              {salarySuffix(job.salary) && <em>{salarySuffix(job.salary)}</em>}
            </div>
          ) : (
            <div className="signet-salary muted">
              <strong>Salary not disclosed</strong>
            </div>
          )}
          <span className="signet-job-cta">
            View role <i className="bi bi-arrow-right" />
          </span>
        </div>
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
