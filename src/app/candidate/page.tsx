"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import AuthGate from "@/app/components/signet/auth-gate";
import AppShell from "@/app/components/signet/app-shell";
import JobCard from "@/app/components/signet/job-card";
import { JobListShimmer } from "@/app/components/signet/shimmer";
import { useAuth } from "@/context/auth-context";
import { fetchCompanies, fetchJobs } from "@/lib/services/jobs";
import { fetchArticles } from "@/lib/services/articles";
import { isJobSaved, saveJob, unsaveJob } from "@/lib/services/saved-jobs";
import { Job } from "@/types/firestore";
import { Article } from "@/types/chat";
import Wrapper from "@/layouts/wrapper";

type CompanyPreview = {
  uid: string;
  companyName?: string;
  fullName?: string;
  logoUrl?: string;
  profileImage?: string;
  industry?: string;
};

function CandidateHomeInner() {
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [companies, setCompanies] = useState<CompanyPreview[]>([]);
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [list, arts, cos] = await Promise.all([
          fetchJobs(12),
          fetchArticles(4),
          fetchCompanies(8),
        ]);
        setJobs(list);
        setArticles(arts);
        setCompanies(cos as CompanyPreview[]);
        if (user) {
          const entries = await Promise.all(
            list.map(async (j) => [j.id, await isJobSaved(user.uid, j.id)] as const)
          );
          setSavedMap(Object.fromEntries(entries));
        }
      } catch {
        toast.error("Could not load feed. Check Firebase connection.");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const toggleSave = async (job: Job) => {
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
  };

  return (
    <AppShell role="candidate" title={`Hi, ${profile?.fullName?.split(" ")[0] || "there"}`}>
      <div className="signet-stats">
        <Link href="/jobs" className="stat text-decoration-none">
          <div className="n"><i className="bi bi-briefcase" /></div>
          <div className="l">Browse jobs</div>
        </Link>
        <Link href="/candidate/my-jobs" className="stat text-decoration-none">
          <div className="n"><i className="bi bi-bookmark" /></div>
          <div className="l">My jobs</div>
        </Link>
        <Link href="/candidate/chat" className="stat text-decoration-none">
          <div className="n"><i className="bi bi-chat-dots" /></div>
          <div className="l">Messages</div>
        </Link>
        <Link href="/candidate/companies" className="stat text-decoration-none">
          <div className="n"><i className="bi bi-buildings" /></div>
          <div className="l">Companies</div>
        </Link>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 style={{ color: "#12141A", fontWeight: 700, fontSize: 20, margin: 0 }}>
          Latest openings
        </h3>
        <Link href="/jobs" style={{ color: "#004CF0", fontWeight: 700 }}>
          See all
        </Link>
      </div>

      {loading && <JobListShimmer count={4} />}
      {!loading && jobs.length === 0 && (
        <div className="signet-empty signet-panel">
          <h4>No jobs yet</h4>
          <p>When companies post roles, they&apos;ll show up here.</p>
        </div>
      )}
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          saved={!!savedMap[job.id]}
          onSaveToggle={() => toggleSave(job)}
        />
      ))}

      {companies.length > 0 && (
        <>
          <div className="d-flex justify-content-between align-items-center mt-4 mb-3">
            <h3 style={{ color: "#12141A", fontWeight: 700, fontSize: 20, margin: 0 }}>
              Companies hiring
            </h3>
            <Link href="/candidate/companies" style={{ color: "#004CF0", fontWeight: 700 }}>
              See all
            </Link>
          </div>
          <div className="d-flex gap-3 overflow-auto pb-2">
            {companies.map((c) => {
              const name = c.companyName || c.fullName || "Company";
              return (
                <Link
                  key={c.uid}
                  href={`/candidate/companies/${c.uid}`}
                  className="signet-panel text-decoration-none"
                  style={{ minWidth: 160, flex: "0 0 auto" }}
                >
                  <div className="signet-logo-tile mb-2">
                    {c.logoUrl || c.profileImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.logoUrl || c.profileImage} alt={name} />
                    ) : (
                      <span>{name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="signet-job-title" style={{ fontSize: 15 }}>
                    {name}
                  </div>
                  {c.industry && (
                    <div style={{ color: "#6B7280", fontSize: 12 }}>{c.industry}</div>
                  )}
                </Link>
              );
            })}
          </div>
        </>
      )}

      {articles.length > 0 && (
        <>
          <div className="d-flex justify-content-between align-items-center mt-4 mb-3">
            <h3 style={{ color: "#12141A", fontWeight: 700, fontSize: 20, margin: 0 }}>
              Career tips
            </h3>
            <Link href="/candidate/articles" style={{ color: "#004CF0", fontWeight: 700 }}>
              See all
            </Link>
          </div>
          <div className="row">
            {articles.map((a) => (
              <div key={a.id} className="col-md-6">
                <Link href={`/candidate/articles/${a.id}`} className="signet-article-card">
                  {a.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="thumb" src={a.image} alt={a.title} />
                  )}
                  <div className="body">
                    <h3>{a.title}</h3>
                    <p>{a.subtitle || a.author}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </AppShell>
  );
}

export default function CandidateHomePage() {
  return (
    <Wrapper>
      <AuthGate role="candidate">
        <CandidateHomeInner />
      </AuthGate>
    </Wrapper>
  );
}
