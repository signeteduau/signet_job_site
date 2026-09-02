"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Wrapper from "@/layouts/wrapper";
import PublicSiteNav from "@/app/components/signet/public-site-nav";
import { NkScrollRail } from "@/app/components/signet/nk-scroll-rail";
import SearchSuggestions from "@/app/components/signet/search-suggestions";
import { useAuth } from "@/context/auth-context";
import { jobMatchesSearchTerm } from "@/lib/job-utils";
import { fetchCompanies, fetchJobs } from "@/lib/services/jobs";
import { Job } from "@/types/firestore";
import { SIGNET_LOGO as signetLogo, SIGNET_LOGO_ALT } from "@/lib/brand";

type CompanyRow = {
  uid: string;
  companyName?: string;
  fullName?: string;
  logoUrl?: string;
  profileImage?: string;
  industry?: string;
  companyLocation?: string;
  address?: string;
};

const JOB_SEARCH_BANNER_IMAGE =
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1800&q=85";

const CATEGORY_PILLS = [
  { label: "Automotive", icon: "bi-car-front-fill", term: "Automotive" },
  { label: "Business", icon: "bi-briefcase-fill", term: "Business" },
  {
    label: "Building & Construction",
    icon: "bi-bricks",
    term: "Building & Construction",
  },
  {
    label: "Community Service",
    icon: "bi-heart-fill",
    term: "Community Service",
  },
  {
    label: "Fabrication and Manufacturing",
    icon: "bi-gear-wide-connected",
    term: "Fabrication and Manufacturing",
  },
  { label: "GE", icon: "bi-mortarboard-fill", term: "GE" },
  { label: "Health", icon: "bi-heart-pulse-fill", term: "Health" },
];

const TOP_HIRING_BUCKETS = [
  { label: "MNCs", match: /mnc|corporate|consulting|it services/i },
  { label: "Product", match: /product|saas|software/i },
  { label: "Banking & Finance", match: /bank|finance|fintech/i },
  { label: "Healthcare", match: /health|pharma|medical/i },
  { label: "Edtech", match: /edtech|education|learning/i },
  { label: "Startup", match: /startup|early stage/i },
];

const POPULAR_ROLES = [
  "Software Engineer",
  "Data Analyst",
  "Product Manager",
  "Digital Marketing",
  "HR Executive",
  "Sales Manager",
  "UI/UX Designer",
  "Business Analyst",
];

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}K+`;
  return `${n}`;
}

function jobCountLabel(n: number) {
  if (n === 1) return "1 Job";
  return `${formatCount(n)} Jobs`;
}

function companyName(c: CompanyRow) {
  return c.companyName || c.fullName || "Company";
}

function companyLogo(c: CompanyRow) {
  return c.logoUrl || c.profileImage || "";
}

export default function Home() {
  const router = useRouter();
  const { user, profile, loading: authLoading, homePath } = useAuth();
  const loggedIn = !authLoading && !!user;
  const isCompany = profile?.userType === "company";
  const designationInputRef = useRef<HTMLInputElement>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [designation, setDesignation] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [jobList, companyList] = await Promise.all([
          fetchJobs(200),
          fetchCompanies(16),
        ]);
        if (!alive) return;
        setJobs(jobList);
        setCompanies(companyList as CompanyRow[]);
      } catch {
        if (alive) {
          setJobs([]);
          setCompanies([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const goSearch = (overrides?: { term?: string; location?: string }) => {
    const params = new URLSearchParams();
    const q = (overrides?.term ?? designation).trim();
    const loc = (overrides?.location ?? location).trim();
    if (q) params.set("q", q);
    if (loc) params.set("location", loc);
    if (experience.trim()) params.set("experience", experience.trim());
    const qs = params.toString();
    router.push(qs ? `/jobs?${qs}` : "/jobs");
  };

  const jobsByCompany = useMemo(() => {
    const map: Record<string, number> = {};
    jobs.forEach((j) => {
      const id = j.companyId || j.companyName;
      if (!id) return;
      map[id] = (map[id] || 0) + 1;
    });
    return map;
  }, [jobs]);

  const topHiringBuckets = useMemo(() => {
    return TOP_HIRING_BUCKETS.map((bucket) => {
      const matchedJobs = jobs.filter((j) => {
        const hay = `${j.category} ${j.type} ${j.companyName} ${j.title}`.toLowerCase();
        return bucket.match.test(hay);
      });
      const matchedCompanies = companies.filter((c) => {
        const hay = `${c.industry} ${companyName(c)}`.toLowerCase();
        return bucket.match.test(hay);
      });
      const pool = matchedCompanies.length ? matchedCompanies : companies;
      const count = Math.max(
        matchedJobs.length,
        matchedCompanies.length,
        Math.ceil(jobs.length / 6)
      );
      return {
        label: bucket.label,
        count,
        logos: pool.slice(0, 4),
      };
    });
  }, [jobs, companies]);

  const roleCounts = useMemo(() => {
    return POPULAR_ROLES.map((role) => ({
      role,
      count: jobs.filter((j) => jobMatchesSearchTerm(j, role)).length,
    }));
  }, [jobs]);

  const roleSuggestions = useMemo(() => {
    const pool = new Set<string>([
      ...POPULAR_ROLES,
      ...CATEGORY_PILLS.map((item) => item.label),
      ...jobs.map((j) => j.title).filter((v): v is string => Boolean(v)),
      ...jobs.map((j) => j.category).filter((v): v is string => Boolean(v)),
      ...jobs.flatMap((j) => j.skills || []).filter((v): v is string => Boolean(v)),
    ]);
    return Array.from(pool).sort((a, b) => a.localeCompare(b));
  }, [jobs]);

  const suggestedSearch = jobs[0]?.title || "software developer";

  return (
    <Wrapper>
      <div className="nk-site">
        <PublicSiteNav />

        <main>
          <section className="nk-hero">
            <div className="nk-hero-bg" aria-hidden>
              <span className="nk-hero-blob nk-hero-blob-a" />
              <span className="nk-hero-blob nk-hero-blob-b" />
              <span className="nk-hero-blob nk-hero-blob-c" />
              <span className="nk-hero-grid" />
            </div>
            <div className="nk-container nk-hero-inner">
              <div className="nk-hero-headline">
                <span className="nk-hero-plane" aria-hidden>
                  <svg viewBox="0 0 64 32" fill="none">
                    <path d="M62 16 L2 4 L36 16 L2 28 Z" fill="#2550eb" />
                    <path d="M36 16 L46 26 L42 16 Z" fill="#1d3fc4" />
                    <path d="M36 16 L2 4 L30 16 Z" fill="#6d8cff" />
                  </svg>
                </span>
                <h1>
                  <span className="nk-hero-lead">Discover Your Next</span>
                  <span className="nk-hero-stage">
                    <span className="nk-hero-line-text">Great Opportunity</span>
                    <span className="nk-hero-hanger" aria-hidden>
                      <span className="nk-hero-hanger-swing">
                        <span className="nk-hero-rope" />
                        <svg viewBox="0 0 88 128" fill="none">
                          <circle cx="42" cy="34" r="14" fill="#F6C9A8" />
                          <ellipse cx="36" cy="38" rx="3.2" ry="2" fill="#E8A48A" opacity="0.55" />
                          <path d="M30 30c3-12 24-14 26 1-8-4-18-3-26-1Z" fill="#1c2740" />
                          <circle cx="37" cy="33" r="1.8" fill="#1c2740" />
                          <circle cx="47" cy="33" r="1.8" fill="#1c2740" />
                          <circle cx="37.6" cy="32.4" r="0.55" fill="#fff" />
                          <path d="M38 40c2.4 2.6 6.6 2.6 9 0" stroke="#C47A62" strokeWidth="1.6" strokeLinecap="round" />
                          <path d="M28 52c0-7 6-12 14-12s14 5 14 12v26c0 5-5 9-14 9s-14-4-14-9V52Z" fill="#2550eb" />
                          <path d="M38 50h8l-4 7-4-7Z" fill="#fff" />
                          <path d="M28 56c-8-10-5-18 6-22" stroke="#2550eb" strokeWidth="6" strokeLinecap="round" />
                          <path d="M56 58c11 1 14 12 9 20" stroke="#2550eb" strokeWidth="6" strokeLinecap="round" />
                          <rect x="60" y="74" width="20" height="14" rx="3" fill="#1c2740" stroke="#c9a227" strokeWidth="1.5" />
                          <path d="M67 74v-2.2a4 4 0 0 1 8 0V74" stroke="#c9a227" strokeWidth="1.6" />
                          <path d="M34 86v22" stroke="#1c2740" strokeWidth="6" strokeLinecap="round" />
                          <path d="M50 86v18" stroke="#1c2740" strokeWidth="6" strokeLinecap="round" />
                          <path d="M28 108h14" stroke="#1c2740" strokeWidth="5" strokeLinecap="round" />
                          <path d="M46 104h14" stroke="#1c2740" strokeWidth="5" strokeLinecap="round" />
                        </svg>
                      </span>
                    </span>
                    <span className="nk-hero-underline" aria-hidden />
                  </span>
                </h1>
              </div>

              <form
                className="nk-search"
                onSubmit={(e) => {
                  e.preventDefault();
                  goSearch();
                }}
              >
                <div className="nk-search-wrap">
                  <div className="nk-search-shell">
                    <div className="nk-search-segment nk-search-designation">
                      <label className="nk-search-designation-label">
                        <i className="bi bi-search" aria-hidden />
                        <input
                          ref={designationInputRef}
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          onFocus={() => setSuggestionsOpen(true)}
                          placeholder="Enter skills / designations / companies"
                          aria-label="Skills or designations"
                          autoComplete="off"
                          aria-expanded={suggestionsOpen && designation.trim().length > 0}
                          aria-controls="landing-search-suggestions"
                        />
                      </label>
                      {designation ? (
                        <button
                          type="button"
                          className="nk-search-clear"
                          aria-label="Clear search"
                          onClick={() => setDesignation("")}
                        >
                          <i className="bi bi-x" />
                        </button>
                      ) : null}
                    </div>

                    <label className="nk-search-segment nk-search-exp">
                    <select
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      aria-label="Experience"
                      data-empty={!experience ? "true" : "false"}
                    >
                      <option value="">Select experience</option>
                      <option value="Fresher">Fresher</option>
                      <option value="1">1 year</option>
                      <option value="2">2 years</option>
                      <option value="3">3 years</option>
                      <option value="5">5+ years</option>
                    </select>
                  </label>

                  <label className="nk-search-segment nk-search-location">
                    <input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Enter location"
                      aria-label="Location"
                    />
                  </label>

                    <button type="submit" className="nk-search-submit">
                      Search
                    </button>
                  </div>
                  <SearchSuggestions
                    id="landing-search-suggestions"
                    query={designation}
                    suggestions={roleSuggestions}
                    inputRef={designationInputRef}
                    open={suggestionsOpen}
                    onOpenChange={setSuggestionsOpen}
                    className="nk-search-suggestions"
                    onSelect={(value) => setDesignation(value)}
                  />
                </div>
              </form>

              <button
                type="button"
                className="nk-suggested-search"
                onClick={() => goSearch({ term: suggestedSearch })}
              >
                <i className="bi bi-arrow-repeat" aria-hidden />
                {suggestedSearch}
              </button>
            </div>
          </section>

          <section className="nk-section nk-section-tight">
            <div className="nk-container">
              <NkScrollRail
                wrapClassName="nk-cat-rail-wrap"
                railClassName="nk-cat-rail"
                ariaLabel="Browse by category"
              >
                {CATEGORY_PILLS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className="nk-cat-pill"
                    onClick={() => goSearch({ term: item.term })}
                  >
                    <i className={`bi ${item.icon}`} aria-hidden />
                    <span>{item.label}</span>
                    <i className="bi bi-chevron-right nk-cat-chevron" aria-hidden />
                  </button>
                ))}
              </NkScrollRail>
            </div>
          </section>

          <section className="nk-section">
            <div className="nk-container">
              <h2 className="nk-section-title">Explore Top Employers</h2>
              <NkScrollRail railClassName="nk-top-hire-rail" ariaLabel="Explore Top Employers">
                {topHiringBuckets.map((bucket) => (
                  <button
                    key={bucket.label}
                    type="button"
                    className="nk-top-hire-card"
                    onClick={() => goSearch({ term: bucket.label })}
                  >
                    <div className="nk-top-hire-head">
                      <strong>{bucket.label}</strong>
                      <i className="bi bi-chevron-right" aria-hidden />
                    </div>
                    <p>{formatCount(bucket.count)} are actively hiring</p>
                    <div className="nk-top-hire-logos">
                      {bucket.logos.map((c) => {
                        const name = companyName(c);
                        const logo = companyLogo(c);
                        return (
                          <span key={c.uid} className="nk-top-hire-logo" title={name}>
                            {logo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={logo} alt="" />
                            ) : (
                              name.slice(0, 1).toUpperCase()
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </button>
                ))}
              </NkScrollRail>
            </div>
          </section>

          <section className="nk-section nk-section-soft">
            <div className="nk-container">
              <h2 className="nk-section-title">Employers Ready to Hire</h2>

              {loading && (
                <NkScrollRail railClassName="nk-featured-rail" ariaLabel="Employers ready to hire">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="nk-featured-card is-skeleton" aria-hidden>
                      <span className="nk-shimmer nk-shimmer-logo lg" />
                      <span className="nk-shimmer nk-shimmer-line" />
                      <span className="nk-shimmer nk-shimmer-line short" />
                    </div>
                  ))}
                </NkScrollRail>
              )}

              {!loading && companies.length === 0 && (
                <div className="nk-empty">
                  <p>Company profiles will appear here as employers join Signet.</p>
                </div>
              )}

              {!loading && companies.length > 0 && (
                <>
                  <NkScrollRail railClassName="nk-featured-rail" ariaLabel="Featured companies">
                      {companies.slice(0, 8).map((c) => {
                        const name = companyName(c);
                        const logo = companyLogo(c);
                        const openRoles =
                          jobsByCompany[c.uid] ||
                          jobs.filter(
                            (j) =>
                              j.companyId === c.uid ||
                              j.companyName?.toLowerCase() === name.toLowerCase()
                          ).length;
                        return (
                          <Link
                            key={c.uid}
                            href={`/jobs?q=${encodeURIComponent(name)}`}
                            className="nk-featured-card"
                          >
                            <span className="nk-featured-logo">
                              {logo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={logo} alt="" />
                              ) : (
                                <span>{name.slice(0, 1).toUpperCase()}</span>
                              )}
                            </span>
                            <div className="nk-featured-info">
                              <strong>{name}</strong>
                              <span className="nk-featured-rating">
                                <i className="bi bi-star-fill" />
                                4.{(c.uid.charCodeAt(0) % 5) + 1}
                                <em>(
                                  {openRoles > 0
                                    ? `${openRoles} open roles`
                                    : "Actively hiring"}
                                )</em>
                              </span>
                            </div>
                            <p className="nk-featured-tagline">
                              {c.industry ||
                                c.companyLocation ||
                                "Explore open roles and apply in minutes"}
                            </p>
                            <span className="nk-featured-cta">View Jobs</span>
                          </Link>
                        );
                      })}
                  </NkScrollRail>
                  <div className="nk-section-cta">
                    <Link href="/companies" className="nk-search-submit">
                      View all companies
                    </Link>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="nk-section">
            <div className="nk-container">
              <div className="nk-roles-panel">
                <h2 className="nk-section-title">Find Opportunities Across Top Fields</h2>
                <p className="nk-section-sub">
                  Choose your profession to see open positions
                </p>
                <div className="nk-role-grid">
                  {roleCounts.map(({ role, count }) => (
                    <button
                      key={role}
                      type="button"
                      className="nk-role-card"
                      onClick={() => goSearch({ term: role })}
                    >
                      <strong>{role}</strong>
                      <em>{jobCountLabel(count)}</em>
                      <i className="bi bi-chevron-right" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="nk-section" id="open-roles">
            <div className="nk-container">
              <div className="nk-banner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="nk-banner-photo"
                  src={JOB_SEARCH_BANNER_IMAGE}
                  alt=""
                  aria-hidden
                />
                <span className="nk-banner-overlay" aria-hidden />
                <span className="nk-banner-deco" aria-hidden />
                <div className="nk-banner-copy">
                  <p className="nk-banner-kicker">Your next career move</p>
                  <h2>Discover opportunities built for you</h2>
                  <p>
                    Browse roles from leading companies, build your profile in minutes,
                    and apply with one click — all on Signet Employment Hub.
                  </p>
                </div>
                <div className="nk-banner-actions">
                  <Link href="/jobs" className="nk-btn nk-btn-on-dark">
                    Browse all jobs
                  </Link>
                  {loggedIn ? (
                    <Link href={homePath} className="nk-btn nk-btn-banner-ghost">
                      {isCompany ? "Open company dashboard" : "Go to dashboard"}
                    </Link>
                  ) : (
                    <Link href="/register" className="nk-btn nk-btn-banner-ghost">
                      Register for free
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="nk-footer">
          <div className="nk-container nk-footer-grid">
            <div className="nk-footer-brand-col">
              <div className="nk-brand nk-footer-brand">
                <span className="nk-brand-mark">
                  <Image
                    src={signetLogo}
                    alt={SIGNET_LOGO_ALT}
                    width={32}
                    height={32}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </span>
              </div>
              <p className="nk-footer-brand-name">{SIGNET_LOGO_ALT}</p>
            </div>
            <div>
              <h4>About us</h4>
              <Link href="/">Careers</Link>
              <Link href="/register?type=company">Employer home</Link>
              <Link href="/jobs">Browse jobs</Link>
              <Link href="/career-tips">Career tips</Link>
            </div>
            <div>
              <h4>Help center</h4>
              <Link href="/support">Support</Link>
              <Link href="/support">Report issue</Link>
            </div>
            <div>
              <h4>Legal</h4>
              <Link href="/privacy">Privacy policy</Link>
              <Link href="/terms">Terms &amp; conditions</Link>
            </div>
            <div className="nk-footer-app">
              <strong>Download our App</strong>
              <p>Get real-time job updates on our App</p>
              <p className="nk-footer-coming-soon">We&apos;re working on it — Coming Soon</p>
            </div>
          </div>
          <div className="nk-container nk-footer-bottom">
            <span>© {new Date().getFullYear()} Signet Employment Hub. All Rights Reserved.</span>
            <span>All trademarks are the property of their respective owners.</span>
          </div>
        </footer>
      </div>
    </Wrapper>
  );
}
