"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Wrapper from "@/layouts/wrapper";
import { JobListShimmer } from "@/app/components/signet/shimmer";
import { fetchCompanies, fetchJobs } from "@/lib/services/jobs";
import { salarySuffix } from "@/lib/job-utils";
import { Job } from "@/types/firestore";
import signetLogo from "@/assets/images/logo/signet-icon.png";

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

const QUICK_CHIPS = [
  "Fresher",
  "Marketing",
  "Software & IT",
  "Banking & Finance",
  "HR",
  "Remote",
  "Internship",
  "Full Time",
];

const HIRING_TILES = [
  { label: "MNCs", icon: "bi-buildings", tone: "blue" },
  { label: "Startups", icon: "bi-rocket-takeoff", tone: "orange" },
  { label: "Remote", icon: "bi-laptop", tone: "teal" },
  { label: "Internship", icon: "bi-mortarboard", tone: "purple" },
  { label: "Marketing", icon: "bi-megaphone", tone: "pink" },
  { label: "Software", icon: "bi-code-slash", tone: "indigo" },
  { label: "HR", icon: "bi-people", tone: "green" },
  { label: "Finance", icon: "bi-graph-up-arrow", tone: "amber" },
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
  "Content Writer",
  "Customer Success",
  "DevOps Engineer",
  "Operations",
];

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}K+`;
  return `${n}`;
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
          fetchCompanies(12),
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

  const goSearch = (overrides?: {
    term?: string;
    location?: string;
  }) => {
    const params = new URLSearchParams();
    const q = (overrides?.term ?? designation).trim();
    const loc = (overrides?.location ?? location).trim();
    if (q) params.set("q", q);
    if (loc) params.set("location", loc);
    if (experience.trim()) params.set("experience", experience.trim());
    const qs = params.toString();
    router.push(qs ? `/jobs?${qs}` : "/jobs");
  };

  const roleCounts = useMemo(() => {
    return POPULAR_ROLES.map((role) => {
      const key = role.toLowerCase();
      const count = jobs.filter((j) => {
        const hay = `${j.title} ${j.category} ${(j.skills || []).join(" ")}`.toLowerCase();
        return key.split(" ").some((w) => w.length > 2 && hay.includes(w));
      }).length;
      return { role, count: Math.max(count, Math.floor(jobs.length / 6) || 1) };
    });
  }, [jobs]);

  const jobsByCompany = useMemo(() => {
    const map: Record<string, number> = {};
    jobs.forEach((j) => {
      const id = j.companyId || j.companyName;
      if (!id) return;
      map[id] = (map[id] || 0) + 1;
    });
    return map;
  }, [jobs]);

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
                    alt="Signet"
                    width={36}
                    height={36}
                    sizes="36px"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    priority
                  />
                </span>
                <span className="nk-brand-text">
                  <strong>SIGNET</strong>
                  <em>Employment Hub</em>
                </span>
              </Link>
              <nav className="nk-nav-links" aria-label="Primary">
                <Link href="/jobs">Jobs</Link>
                <Link href="/jobs">Companies</Link>
                <Link href="/register?type=company">Services</Link>
              </nav>
            </div>
            <div className="nk-nav-right">
              <Link href="/register?type=company" className="nk-nav-employer">
                For employers
              </Link>
              <Link href="/login" className="nk-btn nk-btn-ghost">
                Login
              </Link>
              <Link href="/register" className="nk-btn nk-btn-primary">
                Register
              </Link>
            </div>
          </div>
        </header>

        <main>
          <section className="nk-hero">
            <div className="nk-hero-grid" aria-hidden />
            <div className="nk-hero-glow" aria-hidden />
            <div className="nk-hero-orb nk-hero-orb-a" aria-hidden />
            <div className="nk-hero-orb nk-hero-orb-b" aria-hidden />
            <div className="nk-hero-orb nk-hero-orb-c" aria-hidden />
            <div className="nk-container nk-hero-inner">
              <p className="nk-hero-brand">
                <span className="nk-hero-dot" /> SIGNET EMPLOYMENT HUB
              </p>
              <h1>
                Find your <span>dream job</span> now
              </h1>
              <p className="nk-hero-sub">
                {loading
                  ? "Loading openings for you to explore"
                  : (
                    <>
                      <strong>{formatCount(Math.max(jobs.length, 1))}+</strong>{" "}
                      jobs for you to explore
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
                  <div className="nk-search-field nk-search-designation">
                    <span className="nk-search-ico" aria-hidden>
                      <i className="bi bi-search" />
                    </span>
                    <span className="nk-search-control">
                      <span className="nk-search-label">Skills / Role</span>
                      <input
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        placeholder="e.g. UI Designer, React, Signet"
                        aria-label="Skills or designations"
                      />
                    </span>
                    {designation ? (
                      <button
                        type="button"
                        className="nk-search-clear"
                        aria-label="Clear skills"
                        onClick={() => setDesignation("")}
                      >
                        <i className="bi bi-x" />
                      </button>
                    ) : null}
                  </div>

                  <span className="nk-search-divider" aria-hidden />

                  <div className="nk-search-field nk-search-exp">
                    <span className="nk-search-ico" aria-hidden>
                      <i className="bi bi-briefcase" />
                    </span>
                    <span className="nk-search-control">
                      <span className="nk-search-label">Experience</span>
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
                    </span>
                  </div>

                  <span className="nk-search-divider" aria-hidden />

                  <div className="nk-search-field nk-search-location">
                    <span className="nk-search-ico" aria-hidden>
                      <i className="bi bi-geo-alt" />
                    </span>
                    <span className="nk-search-control">
                      <span className="nk-search-label">Location</span>
                      <input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="City or remote"
                        aria-label="Location"
                      />
                    </span>
                    {location ? (
                      <button
                        type="button"
                        className="nk-search-clear"
                        aria-label="Clear location"
                        onClick={() => setLocation("")}
                      >
                        <i className="bi bi-x" />
                      </button>
                    ) : null}
                  </div>

                  <button type="submit" className="nk-btn nk-btn-search">
                    <i className="bi bi-search" aria-hidden />
                    Search
                  </button>
                </div>
              </form>

              <div className="nk-chips-wrap">
                <span className="nk-chips-label">Popular searches</span>
                <div className="nk-chips" role="list">
                  {QUICK_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      className="nk-chip"
                      role="listitem"
                      onClick={() => goSearch({ term: chip })}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="nk-trust">
                <span>
                  <i className="bi bi-shield-check" /> Verified employers
                </span>
                <span>
                  <i className="bi bi-phone" /> App synced
                </span>
                <span>
                  <i className="bi bi-lightning-charge" /> Fast apply
                </span>
              </div>
            </div>
          </section>

          <section className="nk-section nk-hiring">
            <div className="nk-container">
              <div className="nk-rail-wrap">
                <div className="nk-rail" aria-label="Hiring categories">
                  {HIRING_TILES.map((tile, i) => (
                    <button
                      key={tile.label}
                      type="button"
                      className={`nk-hire-card tone-${tile.tone}`}
                      style={{ animationDelay: `${i * 40}ms` }}
                      onClick={() => goSearch({ term: tile.label })}
                    >
                      <span className="nk-hire-icon">
                        <i className={`bi ${tile.icon}`} />
                      </span>
                      <strong>{tile.label}</strong>
                      <em>
                        {formatCount(
                          Math.max(
                            1,
                            jobs.filter((j) =>
                              `${j.title} ${j.category} ${j.type}`
                                .toLowerCase()
                                .includes(tile.label.toLowerCase().split(" ")[0])
                            ).length || Math.ceil(jobs.length / 5)
                          )
                        )}{" "}
                        are actively hiring
                      </em>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="nk-section">
            <div className="nk-container">
              <div className="nk-section-head">
                <div>
                  <p className="nk-eyebrow">Top companies</p>
                  <h2>Featured companies actively hiring</h2>
                </div>
                <Link href="/jobs" className="nk-link">
                  View all <i className="bi bi-chevron-right" />
                </Link>
              </div>

              {loading && (
                <div className="nk-company-rail">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="nk-company-card is-skeleton" aria-hidden>
                      <span className="nk-shimmer nk-shimmer-logo" />
                      <span className="nk-shimmer nk-shimmer-line" />
                      <span className="nk-shimmer nk-shimmer-line short" />
                    </div>
                  ))}
                </div>
              )}

              {!loading && companies.length === 0 && (
                <div className="nk-empty">
                  <p>Company profiles will appear here as employers join Signet.</p>
                </div>
              )}

              {!loading && companies.length > 0 && (
                <div className="nk-rail-wrap">
                <div className="nk-company-rail">
                  {companies.map((c) => {
                    const name = c.companyName || c.fullName || "Company";
                    const logo = c.logoUrl || c.profileImage;
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
                        className="nk-company-card"
                      >
                        <span className="nk-company-logo">
                          {logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={logo} alt="" />
                          ) : (
                            <span>{name.slice(0, 1).toUpperCase()}</span>
                          )}
                        </span>
                        <strong>{name}</strong>
                        <span className="nk-company-rating">
                          <i className="bi bi-star-fill" />
                          4.{(c.uid.charCodeAt(0) % 5) + 1}
                          <em>
                            {openRoles > 0
                              ? `${openRoles} open roles`
                              : "Actively hiring"}
                          </em>
                        </span>
                        <p className="nk-company-tagline">
                          {c.industry ||
                            c.companyLocation ||
                            c.address ||
                            "Grow your career with us"}
                        </p>
                        <span className="nk-company-tags">
                          <span>{c.industry ? "Verified" : "New"}</span>
                          <span>Hiring</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
                </div>
              )}
            </div>
          </section>

          <section className="nk-section nk-section-soft">
            <div className="nk-container">
              <div className="nk-roles-panel">
                <div className="nk-section-head">
                  <div>
                    <p className="nk-eyebrow">By role</p>
                    <h2>Discover jobs across popular roles</h2>
                    <p>Select a role and we’ll show you relevant jobs for it</p>
                  </div>
                </div>
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
              <div className="nk-section-head">
                <div>
                  <p className="nk-eyebrow">Fresh openings</p>
                  <h2>Latest jobs</h2>
                </div>
                <Link href="/jobs" className="nk-link">
                  View all <i className="bi bi-chevron-right" />
                </Link>
              </div>

              {loading && <JobListShimmer count={4} />}

              {!loading && jobs.length === 0 && (
                <div className="nk-empty">
                  <h4>No live jobs yet</h4>
                  <p>Post a vacancy from a company account to get started.</p>
                  <Link href="/register?type=company" className="nk-btn nk-btn-primary mt-3">
                    Post a job
                  </Link>
                </div>
              )}

              <div className="nk-job-list">
                {!loading &&
                  jobs.slice(0, 8).map((job) => {
                    const suffix = salarySuffix(job.salary);
                    return (
                      <Link
                        key={job.id}
                        href={`/jobs/${job.id}`}
                        className="nk-job-card"
                      >
                        <span className="nk-job-logo">
                          {job.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={job.logoUrl} alt="" />
                          ) : (
                            <span>
                              {(job.companyName || "S").slice(0, 1).toUpperCase()}
                            </span>
                          )}
                        </span>
                        <div className="nk-job-body">
                          <strong>{job.title}</strong>
                          <em>{job.companyName || "Company"}</em>
                          <div className="nk-job-meta">
                            {job.location && (
                              <span>
                                <i className="bi bi-geo-alt" /> {job.location}
                              </span>
                            )}
                            {job.type && (
                              <span>
                                <i className="bi bi-briefcase" /> {job.type}
                              </span>
                            )}
                            {job.experience && (
                              <span>
                                <i className="bi bi-bar-chart" /> {job.experience}
                              </span>
                            )}
                            {job.salary && (
                              <span>
                                <i className="bi bi-cash" /> {job.salary}
                                {suffix || ""}
                              </span>
                            )}
                          </div>
                          {(job.skills || []).length > 0 && (
                            <div className="nk-job-skills">
                              {(job.skills || []).slice(0, 3).map((skill) => (
                                <span key={skill}>{skill}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="nk-job-side">
                          <span className="nk-job-cta">Apply</span>
                          <i className="bi bi-chevron-right nk-job-chevron" />
                        </span>
                      </Link>
                    );
                  })}
              </div>
            </div>
          </section>

          <section className="nk-section">
            <div className="nk-container">
              <div className="nk-banner">
                <div className="nk-banner-deco" aria-hidden />
                <div className="nk-banner-copy">
                  <p className="nk-banner-kicker">For employers</p>
                  <h2>Hire talent with Signet</h2>
                  <p>
                    Post roles, review applicants, and message candidates — synced
                    with the Signet Jobs app.
                  </p>
                </div>
                <div className="nk-banner-actions">
                  <Link href="/register?type=company" className="nk-btn nk-btn-on-dark">
                    Start hiring
                  </Link>
                  <Link href="/login" className="nk-btn nk-btn-ghost-light">
                    Employer login
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="nk-footer">
          <div className="nk-container nk-footer-grid">
            <div>
              <div className="nk-brand nk-footer-brand">
                <span className="nk-brand-mark">
                  <Image
                    src={signetLogo}
                    alt=""
                    width={32}
                    height={32}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </span>
                <strong>SIGNET</strong>
              </div>
              <p>Employment Hub by Hands On Recruitment</p>
            </div>
            <div>
              <h4>Job seekers</h4>
              <Link href="/jobs">Browse jobs</Link>
              <Link href="/register">Create account</Link>
              <Link href="/login">Login</Link>
            </div>
            <div>
              <h4>Employers</h4>
              <Link href="/register?type=company">Post a job</Link>
              <Link href="/login">Employer login</Link>
              <Link href="/support">Support</Link>
            </div>
            <div>
              <h4>Legal</h4>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </div>
          </div>
          <div className="nk-container nk-footer-bottom">
            <span>© {new Date().getFullYear()} Signet Employment Hub</span>
            <span>Powered by Hands On Recruitment</span>
          </div>
        </footer>
      </div>
    </Wrapper>
  );
}
