"use client";
import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import JobCard from "@/app/components/signet/job-card";
import { JobListShimmer, PageLoader } from "@/app/components/signet/shimmer";
import { searchJobs } from "@/lib/services/jobs";
import { JOB_TYPES } from "@/lib/job-utils";
import { Job } from "@/types/firestore";
import Wrapper from "@/layouts/wrapper";
import signetLogo from "@/assets/images/logo/signet-icon.png";

function PublicJobsInner() {
  const search = useSearchParams();
  const initialQ = search?.get("q") || "";
  const initialLoc = search?.get("location") || "";
  const [term, setTerm] = useState(initialQ);
  const [type, setType] = useState("");
  const [location, setLocation] = useState(initialLoc);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async (overrides?: { term?: string; type?: string; location?: string }) => {
    setLoading(true);
    try {
      setJobs(
        await searchJobs({
          term: overrides?.term ?? term,
          type: overrides?.type ?? type,
          location: overrides?.location ?? location,
        })
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTerm(initialQ);
    setLocation(initialLoc);
    load({ term: initialQ, location: initialLoc });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQ, initialLoc]);

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
              <Link href="/login" className="signet-ghost-btn">
                Sign in
              </Link>
              <Link href="/register" className="signet-btn signet-btn-sm">
                Apply
              </Link>
            </div>
          </div>
        </header>

        <main className="container signet-site-jobs" style={{ paddingTop: 32 }}>
          <div className="signet-site-section-head">
            <div>
              <p className="signet-eyebrow">Open roles</p>
              <h1 className="signet-page-title">Browse jobs</h1>
            </div>
          </div>

          <form
            className="signet-search-row"
            onSubmit={(e) => {
              e.preventDefault();
              load();
            }}
          >
            <input
              placeholder="Search title, company, skills…"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All types</option>
              {JOB_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <button className="signet-btn" type="submit">
              Search
            </button>
          </form>

          <p style={{ color: "#6B7280" }} className="mb-3">
            {jobs.length} active jobs · Sign in to apply
          </p>

          {loading && <JobListShimmer count={5} />}
          {!loading && jobs.length === 0 && (
            <div className="signet-empty">
              <h4>No jobs found</h4>
              <p>Try a different search.</p>
            </div>
          )}
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} href={`/jobs/${job.id}`} />
          ))}
        </main>
      </div>
    </Wrapper>
  );
}

export default function PublicJobsPage() {
  return (
    <Suspense fallback={<PageLoader label="Loading jobs…" />}>
      <PublicJobsInner />
    </Suspense>
  );
}
