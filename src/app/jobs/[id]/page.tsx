"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import JobCard from "@/app/components/signet/job-card";
import { JobCardShimmer, PanelShimmer } from "@/app/components/signet/shimmer";
import { fetchJobById } from "@/lib/services/jobs";
import { salarySuffix } from "@/lib/job-utils";
import { Job } from "@/types/firestore";
import Wrapper from "@/layouts/wrapper";
import signetLogo from "@/assets/images/logo/signet-icon.png";

export default function PublicJobDetailPage() {
  const params = useParams();
  const id = String(params?.id || "");
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setJob(await fetchJobById(id));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <Wrapper>
      <div className="signet-site">
        <div className="signet-ambient" aria-hidden />
        <header className="signet-site-nav">
          <div className="container d-flex align-items-center justify-content-between">
            <Link href="/" className="signet-brand-link">
              <span className="signet-brand-mark">
                <Image
                  src={signetLogo}
                  alt="Signet"
                  width={44}
                  height={44}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </span>
              <span className="d-none d-sm-flex flex-column">
                <span className="signet-brand">SIGNET</span>
                <span className="signet-sub">Employment Hub</span>
              </span>
            </Link>
            <div className="d-flex gap-2">
              <Link href="/jobs" className="signet-ghost-btn">
                All jobs
              </Link>
              <Link href="/login" className="signet-btn signet-btn-sm">
                Sign in to apply
              </Link>
            </div>
          </div>
        </header>

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
              <JobCard job={job} href={`/jobs/${job.id}`} showDescription={false} />
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
                    <h3 style={{ fontWeight: 800, fontSize: 18 }}>Roles &amp; responsibilities</h3>
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
                  <Link href="/register" className="signet-btn">
                    Create account to apply
                  </Link>
                  <Link href="/login" className="signet-btn secondary">
                    Sign in
                  </Link>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </Wrapper>
  );
}
