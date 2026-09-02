"use client";

import React from "react";
import Link from "next/link";
import { AppUser } from "@/types/firestore";
import { getProfileCompletion } from "@/lib/profile-completion";

export default function ProfileCompletionCard({
  profile,
  compact,
}: {
  profile?: AppUser | null;
  compact?: boolean;
}) {
  const summary = getProfileCompletion(profile);
  if (!profile || (compact && summary.percent >= 100)) return null;

  const isCandidate = profile.userType !== "company";
  const tone =
    summary.percent >= 100 ? "done" : summary.percent >= 70 ? "mid" : "low";
  const profileHref =
    profile.userType === "company" ? "/company/profile" : "/candidate/profile";

  const title =
    summary.percent >= 100 ? "Profile complete" : "Complete your profile";
  const detail =
    summary.percent >= 100
      ? isCandidate
        ? "You can apply for jobs"
        : "Your company profile is ready"
      : "";

  const showCta = Boolean(compact && summary.percent < 100);
  const inner = (
    <>
      <span
        className="signet-complete-ring"
        style={{ ["--pct" as string]: summary.percent }}
        aria-hidden
      >
        <span>{summary.percent}%</span>
      </span>
      <span className="signet-complete-copy">
        <strong>{title}</strong>
        {detail ? <em>{detail}</em> : null}
      </span>
      <span
        className="signet-complete-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={summary.percent}
        aria-label="Profile completion"
      >
        <i style={{ width: `${summary.percent}%` }} />
      </span>
      {showCta && (
        <span className="signet-complete-cta">
          Finish
          <i className="bi bi-arrow-right" aria-hidden />
        </span>
      )}
    </>
  );

  const className = `signet-complete-banner ${tone}${showCta ? " is-link" : " no-cta"}`;

  if (compact && summary.percent < 100) {
    return (
      <Link href={profileHref} className={className}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}
