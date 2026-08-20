"use client";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import JobCard from "@/app/components/signet/job-card";
import JobFiltersSidebar, {
  JobFilters,
} from "@/app/components/signet/job-filters-sidebar";
import PublicSiteNav from "@/app/components/signet/public-site-nav";
import { JobListShimmer, PageLoader } from "@/app/components/signet/shimmer";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { searchJobs } from "@/lib/services/jobs";
import { isJobSaved, saveJob, unsaveJob } from "@/lib/services/saved-jobs";
import { Job } from "@/types/firestore";
import Wrapper from "@/layouts/wrapper";

function PublicJobsInner() {
  const search = useSearchParams();
  const initialQ = search?.get("q") || "";
  const initialLoc = search?.get("location") || "";
  const { user, isCandidateReady, requireAuth } = useRequireAuth();

  const [filters, setFilters] = useState<JobFilters>({
    term: initialQ,
    type: "",
    location: initialLoc,
    experience: "",
    category: "",
    priority: "",
  });
  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const load = async (next?: Partial<JobFilters>) => {
    const merged = { ...filters, ...next };
    setLoading(true);
    try {
      const list = await searchJobs({
        term: merged.term,
        type: merged.type,
        location: merged.location,
        experience: merged.experience,
        category: merged.category,
        priority: merged.priority,
      });
      setJobs(list);
      if (user && isCandidateReady) {
        const entries = await Promise.all(
          list.map(async (j) => [j.id, await isJobSaved(user.uid, j.id)] as const)
        );
        setSavedMap(Object.fromEntries(entries));
      } else {
        setSavedMap({});
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setFilters((f) => ({ ...f, term: initialQ, location: initialLoc }));
    load({ term: initialQ, location: initialLoc });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQ, initialLoc, user, isCandidateReady]);

  const locations = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => {
      const city = j.location?.split(",")[0]?.trim();
      if (city) set.add(city);
    });
    return Array.from(set).sort();
  }, [jobs]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => {
      if (j.category?.trim()) set.add(j.category.trim());
    });
    return Array.from(set).sort();
  }, [jobs]);

  const updateFilters = (patch: Partial<JobFilters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    load(next);
  };

  const clearFilters = () => {
    const cleared: JobFilters = {
      term: filters.term,
      type: "",
      location: "",
      experience: "",
      category: "",
      priority: "",
    };
    setFilters(cleared);
    load(cleared);
  };

  return (
    <Wrapper>
      <div className="signet-site nk-browse-page">
        <div className="signet-ambient" aria-hidden />
        <PublicSiteNav variant="browse" />

        <main className="nk-container nk-browse-layout">
          <JobFiltersSidebar
            filters={filters}
            locations={locations}
            categories={categories}
            onChange={updateFilters}
            onClear={clearFilters}
          />

          <div className="nk-browse-main">
            <div className="nk-browse-results-head">
              <div>
                <h1>
                  {filters.term
                    ? `Jobs for "${filters.term}"`
                    : "Browse jobs"}
                </h1>
                <p>
                  {loading
                    ? "Searching…"
                    : `${jobs.length} active jobs`}
                  {!isCandidateReady && " · Sign in to apply or save roles"}
                </p>
              </div>
            </div>

            {loading && (
              <div className="nk-browse-list">
                <JobListShimmer count={5} />
              </div>
            )}
            {!loading && jobs.length === 0 && (
              <div className="signet-empty nk-browse-empty">
                <h4>No jobs found</h4>
                <p>Try adjusting the filters on the left.</p>
              </div>
            )}

            {!loading && jobs.length > 0 && (
              <div className="nk-browse-list">
                {jobs.map((job, index) => (
                  <React.Fragment key={job.id}>
                    <JobCard
                      job={job}
                      href={`/jobs/${job.id}`}
                      saved={!!savedMap[job.id]}
                      onSaveToggle={async () => {
                        if (
                          !requireAuth({
                            returnUrl: `/jobs/${job.id}`,
                            message: "Sign in to save jobs",
                            role: "candidate",
                          })
                        ) {
                          return;
                        }
                        if (!user) return;
                        try {
                          if (savedMap[job.id]) {
                            await unsaveJob(user.uid, job.id);
                            setSavedMap((m) => ({ ...m, [job.id]: false }));
                          } else {
                            await saveJob(user.uid, job);
                            setSavedMap((m) => ({ ...m, [job.id]: true }));
                          }
                        } catch {
                          toast.error("Could not update saved job.");
                        }
                      }}
                    />
                    {index === 2 && !isCandidateReady && (
                      <div className="nk-browse-register-banner">
                        <div>
                          <strong>
                            Make the most of Signet — register for free!
                          </strong>
                          <p>
                            Apply to jobs, save roles, and get noticed by top
                            companies.
                          </p>
                        </div>
                        <Link href="/register" className="nk-search-submit">
                          Register for free
                        </Link>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          <aside className="nk-browse-promo">
            <div className="nk-browse-promo-card">
              <span className="nk-browse-promo-tag">For job seekers</span>
              <h4>Build your profile</h4>
              <p>
                Complete your profile to apply faster and stand out to
                recruiters.
              </p>
              <Link href="/register" className="nk-search-submit">
                Get started
              </Link>
            </div>
            <div className="nk-browse-promo-card muted">
              <h4>Are you hiring?</h4>
              <p>Post a Jobs and manage applicants from your company dashboard.</p>
              <Link href="/register?type=company" className="nk-search-submit">
                Post a job
              </Link>
            </div>
          </aside>
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
