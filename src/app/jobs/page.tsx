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
import { useAuth } from "@/context/auth-context";
import { fetchJobs, searchJobs } from "@/lib/services/jobs";
import { isJobSaved, saveJob, unsaveJob } from "@/lib/services/saved-jobs";
import { applyBlockMessage } from "@/lib/profile-completion";
import { logAnalyticsEvent } from "@/lib/analytics";
import { Job } from "@/types/firestore";
import Wrapper from "@/layouts/wrapper";

function PublicJobsInner() {
  const search = useSearchParams();
  const initialQ = search?.get("q") || "";
  const initialLoc = search?.get("location") || "";
  const { user, isCandidateReady, requireAuth } = useRequireAuth();
  const { profile, homePath, loading: authLoading } = useAuth();
  const loggedIn = !authLoading && !!user;
  const isCompany = profile?.userType === "company";
  const isCandidate = profile?.userType === "candidate";

  const [filters, setFilters] = useState<JobFilters>({
    term: initialQ,
    types: [],
    locations: initialLoc ? [initialLoc] : [],
    experience: [],
    categories: [],
    priorities: [],
  });
  const [catalog, setCatalog] = useState<Job[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const load = async (next?: Partial<JobFilters>) => {
    const merged = { ...filters, ...next };
    setLoading(true);
    try {
      const list = await searchJobs({
        term: merged.term,
        type: merged.types,
        location: merged.locations,
        experience: merged.experience,
        category: merged.categories,
        priority: merged.priorities,
      });
      setJobs(list);
      if (merged.term.trim()) {
        logAnalyticsEvent("search", { search_term: merged.term.trim() });
      }
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
    let alive = true;
    (async () => {
      try {
        const list = await fetchJobs(200, { activeOnly: true });
        if (alive) setCatalog(list);
      } catch {
        if (alive) setCatalog([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    setFilters((f) => ({
      ...f,
      term: initialQ,
      locations: initialLoc ? [initialLoc] : f.locations,
    }));
    load({
      term: initialQ,
      ...(initialLoc ? { locations: [initialLoc] } : {}),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQ, initialLoc, user, isCandidateReady]);

  const locations = useMemo(() => {
    const set = new Set<string>();
    catalog.forEach((j) => {
      const city =
        j.city?.trim() || j.location?.split(",")[0]?.trim() || "";
      if (city) set.add(city);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [catalog]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    catalog.forEach((j) => {
      if (j.category?.trim()) set.add(j.category.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [catalog]);

  const updateFilters = (patch: Partial<JobFilters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    load(next);
  };

  const clearFilters = () => {
    const cleared: JobFilters = {
      term: filters.term,
      types: [],
      locations: [],
      experience: [],
      categories: [],
      priorities: [],
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
                  {!loggedIn && " · Sign in to apply or save roles"}
                  {loggedIn && isCompany && " · Browsing as employer"}
                  {loggedIn && isCandidate && !isCandidateReady && " · Complete your profile to apply"}
                  {loggedIn && isCandidate && isCandidateReady && applyBlockMessage(profile) && " · Add phone, address, and resume to apply"}
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
                    {index === 2 && !loggedIn && (
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
            {!loggedIn ? (
              <>
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
                  <p>Post a job and manage applicants from your company dashboard.</p>
                  <Link href="/register?type=company" className="nk-search-submit">
                    Post a job
                  </Link>
                </div>
              </>
            ) : isCompany ? (
              <>
                <div className="nk-browse-promo-card">
                  <span className="nk-browse-promo-tag">Employer</span>
                  <h4>Manage your hiring</h4>
                  <p>
                    Review applications, message candidates, and post new roles
                    from your dashboard.
                  </p>
                  <Link href="/company" className="nk-search-submit">
                    Company dashboard
                  </Link>
                </div>
                <div className="nk-browse-promo-card muted">
                  <h4>Need more talent?</h4>
                  <p>Publish a new vacancy to reach candidates on Signet.</p>
                  <Link href="/company/jobs/new" className="nk-search-submit">
                    Post a job
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="nk-browse-promo-card">
                  <span className="nk-browse-promo-tag">For job seekers</span>
                  <h4>{isCandidateReady ? "Your dashboard" : "Complete your profile"}</h4>
                  <p>
                    {isCandidateReady
                      ? "Apply to roles, track applications, and message employers."
                      : "Finish your profile so you can apply and save jobs."}
                  </p>
                  <Link href={homePath} className="nk-search-submit">
                    {isCandidateReady ? "Open dashboard" : "Complete profile"}
                  </Link>
                </div>
                <div className="nk-browse-promo-card muted">
                  <h4>Saved jobs</h4>
                  <p>View roles you bookmarked while browsing.</p>
                  <Link href="/candidate/my-jobs" className="nk-search-submit">
                    My applications
                  </Link>
                </div>
              </>
            )}
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
