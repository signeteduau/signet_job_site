"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Wrapper from "@/layouts/wrapper";
import JobCard from "@/app/components/signet/job-card";
import { JobListShimmer } from "@/app/components/signet/shimmer";
import { fetchJobs } from "@/lib/services/jobs";
import { Job } from "@/types/firestore";
import signetLogo from "@/assets/images/logo/signet-icon.png";

export default function Home() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [term, setTerm] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await fetchJobs(8);
        if (alive) setJobs(list);
      } catch {
        if (alive) setJobs([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

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
                  sizes="44px"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  priority
                />
              </span>
              <span className="d-none d-sm-flex flex-column">
                <span className="signet-brand">SIGNET</span>
                <span className="signet-sub">Employment Hub</span>
              </span>
            </Link>
            <div className="d-flex align-items-center gap-2">
              <Link href="/jobs" className="signet-ghost-btn d-none d-sm-inline-flex">
                Jobs
              </Link>
              <Link href="/login" className="signet-ghost-btn">
                Sign in
              </Link>
              <Link href="/register" className="signet-btn signet-btn-sm">
                Get started
              </Link>
            </div>
          </div>
        </header>

        <main>
          <section className="signet-site-hero">
            <div className="container">
              <div className="signet-site-hero-grid">
                <div className="signet-site-hero-copy">
                  <p className="signet-eyebrow">Hands On Recruitment</p>
                  <h1>
                    Hire and get hired with a clearer Signet experience.
                  </h1>
                  <p className="lead">
                    Browse live openings below, apply with your profile, or post
                    roles and review applicants in one modern workspace.
                  </p>
                  <div className="signet-site-cta">
                    <Link href="/jobs" className="signet-btn">
                      Browse open jobs
                    </Link>
                    <Link href="/register" className="signet-btn secondary">
                      Create free account
                    </Link>
                  </div>
                  <div className="signet-site-pills">
                    <span>
                      <i className="bi bi-person-check" /> Candidates
                    </span>
                    <span>
                      <i className="bi bi-buildings" /> Companies
                    </span>
                    <span>
                      <i className="bi bi-phone" /> App synced
                    </span>
                  </div>
                </div>

                <div className="signet-site-hero-panel">
                  <div className="signet-site-panel-card">
                    <div className="top">
                      <span className="signet-brand-mark">
                        <Image
                          src={signetLogo}
                          alt=""
                          width={44}
                          height={44}
                          sizes="44px"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </span>
                      <div>
                        <strong>Signet workspace</strong>
                        <em>Candidate + company</em>
                      </div>
                    </div>
                    <ul>
                      <li>
                        <i className="bi bi-briefcase" />
                        Live job board
                      </li>
                      <li>
                        <i className="bi bi-chat-dots" />
                        In-app messaging
                      </li>
                      <li>
                        <i className="bi bi-file-earmark-person" />
                        Applications &amp; resumes
                      </li>
                      <li>
                        <i className="bi bi-bell" />
                        Real-time alerts
                      </li>
                    </ul>
                    <Link href="/jobs" className="signet-job-cta">
                      Browse open roles <i className="bi bi-arrow-right" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="signet-site-jobs" id="open-roles">
            <div className="container">
              <div className="signet-site-section-head">
                <div>
                  <p className="signet-eyebrow">Open roles</p>
                  <h2>Latest jobs</h2>
                </div>
                <Link href="/jobs" className="signet-text-link">
                  View all jobs <i className="bi bi-arrow-right" />
                </Link>
              </div>

              <form
                className="signet-search-row mb-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const q = term.trim();
                  router.push(q ? `/jobs?q=${encodeURIComponent(q)}` : "/jobs");
                }}
              >
                <input
                  placeholder="Search title, company, skills…"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  aria-label="Search jobs"
                />
                <button className="signet-btn" type="submit">
                  Search
                </button>
              </form>

              {loading && <JobListShimmer count={4} />}

              {!loading && jobs.length === 0 && (
                <div className="signet-empty">
                  <h4>No live jobs yet</h4>
                  <p>
                    Post a vacancy from a company account — openings from the
                    app will show up here too.
                  </p>
                  <Link href="/register" className="signet-btn mt-3">
                    Post as a company
                  </Link>
                </div>
              )}

              {!loading &&
                jobs.map((job) => (
                  <JobCard key={job.id} job={job} href={`/jobs/${job.id}`} />
                ))}

              {!loading && jobs.length > 0 && (
                <div className="text-center mt-4">
                  <Link href="/jobs" className="signet-btn secondary">
                    See all open roles
                  </Link>
                </div>
              )}
            </div>
          </section>
        </main>

        <footer className="signet-site-footer">
          <div className="container d-flex flex-wrap justify-content-between gap-2">
            <span>© {new Date().getFullYear()} Signet Employment Hub</span>
            <span>Powered by Hands On Recruitment</span>
          </div>
        </footer>
      </div>
    </Wrapper>
  );
}
