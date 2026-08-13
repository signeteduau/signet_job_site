"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Wrapper from "@/layouts/wrapper";
import { NkScrollRail } from "@/app/components/signet/nk-scroll-rail";
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
  { label: "Remote", icon: "bi-house-door", term: "Remote" },
  { label: "MNC", icon: "bi-buildings", term: "MNC" },
  { label: "HR", icon: "bi-people", term: "HR" },
  { label: "Startup", icon: "bi-rocket-takeoff", term: "Startup" },
  { label: "Sales", icon: "bi-graph-up", term: "Sales" },
  { label: "Marketing", icon: "bi-megaphone", term: "Marketing" },
  { label: "Engineering", icon: "bi-gear", term: "Engineering" },
  { label: "Software & IT", icon: "bi-code-slash", term: "Software" },
  { label: "Data Science", icon: "bi-bar-chart-line", term: "Data" },
  { label: "Fresher", icon: "bi-mortarboard", term: "Fresher" },
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

function companyName(c: CompanyRow) {
  return c.companyName || c.fullName || "Company";
}

function companyLogo(c: CompanyRow) {
  return c.logoUrl || c.profileImage || "";
}

export default function Home() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [designation, setDesignation] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [jobList, companyList] = await Promise.all([
          fetchJobs(24),
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
    return POPULAR_ROLES.map((role) => {
      const key = role.toLowerCase();
      const count = jobs.filter((j) => {
        const hay = `${j.title} ${j.category} ${(j.skills || []).join(" ")}`.toLowerCase();
        return key.split(" ").some((w) => w.length > 2 && hay.includes(w));
      }).length;
      return { role, count: Math.max(count, 1) };
    });
  }, [jobs]);

  const suggestedSearch = jobs[0]?.title || "software developer";

  return (
    <Wrapper>
      <div className="nk-site">
        <header className="nk-nav">
          <div className="nk-container nk-nav-inner">
            <div className="nk-nav-left">
              <Link href="/" className="nk-brand">
                <span className="nk-brand-mark">
                  <Image
                    src={signetLogo}
                    alt={SIGNET_LOGO_ALT}
                    width={36}
                    height={36}
                    sizes="36px"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    priority
                  />
                </span>
              </Link>
              <nav className="nk-nav-links" aria-label="Primary">
                <Link href="/"><i className="bi bi-house" /> Home</Link>
                <Link href="/jobs"><i className="bi bi-briefcase" /> Jobs</Link>
                <Link href="/companies"><i className="bi bi-building" /> Companies</Link>
                <Link href="/career-tips"><i className="bi bi-lightbulb" /> Career Tips</Link>
              </nav>
            </div>
            <div className="nk-nav-right">
              {/* <Link href="/register?type=company" className="nk-nav-employer">
                For employers <i className="bi bi-chevron-down" />
              </Link> */}
              <Link href="/login" className="nk-btn nk-btn-ghost">
                Login
              </Link>
              <Link href="/register" className="nk-btn nk-btn-register">
                Register <i className="bi bi-arrow-right" />
              </Link>
            </div>
          </div>
        </header>

        <main>
          <section className="nk-hero">
            <div className="nk-hero-bg" aria-hidden>
              <span className="nk-hero-blob nk-hero-blob-a" />
              <span className="nk-hero-blob nk-hero-blob-b" />
              <span className="nk-hero-blob nk-hero-blob-c" />
              <span className="nk-hero-grid" />
            </div>
            <div className="nk-container nk-hero-inner">
              <h1>Discover Your Next Great Opportunity</h1>
              <p className="nk-hero-sub">
                {loading ? (
                  "Loading openings for you to explore"
                ) : (
                  <>
                    Browse <strong>{formatCount(Math.max(jobs.length, 50))}+</strong> open positions
                  </>
                )}
              </p>

              <form
                className="nk-search"
                onSubmit={(e) => {
                  e.preventDefault();
                  goSearch();
                }}
              >
                <div className="nk-search-shell">
                  <label className="nk-search-segment nk-search-designation">
                    <i className="bi bi-search" aria-hidden />
                    <input
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="Enter skills / designations / companies"
                      aria-label="Skills or designations"
                    />
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
                  </label>

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
                      <em>{formatCount(count)} Jobs</em>
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
                  <Link href="/register" className="nk-btn nk-btn-banner-ghost">
                    Register for free
                  </Link>
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
              <p className="nk-footer-connect">We're Social!</p>
              <div className="nk-footer-social">
                <a href="#" aria-label="Facebook">
                  <i className="bi bi-facebook" />
                </a>
                <a href="#" aria-label="Instagram">
                  <i className="bi bi-instagram" />
                </a>
                <a href="#" aria-label="X">
                  <i className="bi bi-twitter" />
                </a>
                <a href="#" aria-label="LinkedIn">
                  <i className="bi bi-linkedin" />
                </a>
              </div>
            </div>
            <div>
              <h4>About us</h4>
              <Link href="/">Careers</Link>
              <Link href="/register?type=company">Employer home</Link>
              <Link href="/jobs">Browse jobs</Link>
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
              <div className="nk-footer-stores">
                <span className="nk-store-badge nk-search-submit">Google Play</span>
                <span className="nk-store-badge nk-search-submit">App Store</span>
              </div>
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
