"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import AuthGate from "@/app/components/signet/auth-gate";
import AppShell from "@/app/components/signet/app-shell";
import JobCard from "@/app/components/signet/job-card";
import ProfileCompletionCard from "@/app/components/signet/profile-completion-card";
import { JobListShimmer } from "@/app/components/signet/shimmer";
import { useAuth } from "@/context/auth-context";
import { getProfileCompletion } from "@/lib/profile-completion";
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
  companyLocation?: string;
  address?: string;
};

function companyName(c: CompanyPreview) {
  return c.companyName || c.fullName || "Company";
}

function companyLogo(c: CompanyPreview) {
  return c.logoUrl || c.profileImage || "";
}

function companyLocation(c: CompanyPreview) {
  return c.companyLocation || c.address || "";
}

const QUICK_ACTIONS = [
  {
    href: "/jobs",
    icon: "bi-briefcase",
    label: "Browse jobs",
    desc: "Search open roles",
    tone: "blue",
  },
  {
    href: "/candidate/my-jobs",
    icon: "bi-bookmark",
    label: "My jobs",
    desc: "Saved & applied",
    tone: "violet",
  },
  {
    href: "/candidate/chat",
    icon: "bi-chat-dots",
    label: "Messages",
    desc: "Chat with employers",
    tone: "teal",
  },
  {
    href: "/candidate/companies",
    icon: "bi-buildings",
    label: "Companies",
    desc: "Explore employers",
    tone: "amber",
  },
] as const;

function CandidateHomeInner() {
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [companies, setCompanies] = useState<CompanyPreview[]>([]);
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const firstName = profile?.fullName?.split(" ")[0] || "there";

  const openRolesFor = useMemo(() => {
    const map: Record<string, number> = {};
    jobs.forEach((j) => {
      if (j.companyId) {
        map[j.companyId] = (map[j.companyId] || 0) + 1;
      }
      const nameKey = j.companyName?.toLowerCase();
      if (nameKey) {
        map[nameKey] = (map[nameKey] || 0) + 1;
      }
    });
    return (c: CompanyPreview) => {
      const name = companyName(c);
      return (
        map[c.uid] ||
        jobs.filter(
          (j) =>
            j.companyId === c.uid ||
            j.companyName?.toLowerCase() === name.toLowerCase()
        ).length
      );
    };
  }, [jobs]);

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
    <AppShell
      role="candidate"
      title={`Welcome back, ${firstName}`}
      subtitle="Explore new roles, track applications, and stay connected with employers."
    >
      {getProfileCompletion(profile).percent < 100 && (
        <ProfileCompletionCard profile={profile} compact />
      )}
      <div className="signet-dash-actions">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`signet-dash-action tone-${action.tone}`}
          >
            <span className="signet-dash-action-icon">
              <i className={`bi ${action.icon}`} aria-hidden />
            </span>
            <span className="signet-dash-action-body">
              <strong>{action.label}</strong>
              <span>{action.desc}</span>
            </span>
            <i className="bi bi-chevron-right signet-dash-action-chevron" aria-hidden />
          </Link>
        ))}
      </div>

      <section className="signet-dash-section">
        <div className="signet-section-head">
          <div>
            <h3>Latest Openings</h3>
            <p>Fresh roles from employers on Signet</p>
          </div>
          <Link href="/jobs" className="signet-section-link">
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
      </section>

      {companies.length > 0 && (
        <section className="signet-dash-section">
          <div className="signet-section-head">
            <div>
              <h3>Companies Hiring</h3>
              <p>Discover employers actively recruiting</p>
            </div>
            <Link href="/companies" className="signet-section-link">
              See all
            </Link>
          </div>
          <div className="nk-company-rail pb-2">
            {companies.map((c) => {
              const name = companyName(c);
              const logo = companyLogo(c);
              const openRoles = openRolesFor(c);
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
                      name.slice(0, 1).toUpperCase()
                    )}
                  </span>
                  <strong>{name}</strong>
                  <span className="nk-company-rating">
                    <i className="bi bi-star-fill" />
                    4.{(c.uid.charCodeAt(0) % 5) + 1}
                    <em>(
                      {openRoles > 0
                        ? `${openRoles} open roles`
                        : "View open jobs"})
                    </em>
                  </span>
                  <p className="nk-company-tagline">
                    {c.industry ||
                      companyLocation(c) ||
                      "Explore roles from this employer"}
                  </p>
                  <span className="nk-company-cta">
                    View Jobs <i className="bi bi-chevron-right" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {articles.length > 0 && (
        <section className="signet-dash-section">
          <div className="signet-section-head">
            <div>
              <h3>Career tips</h3>
              <p>Advice to help you stand out</p>
            </div>
            <Link href="/candidate/articles" className="signet-section-link">
              See all
            </Link>
          </div>
          <div className="signet-dash-articles">
            {articles.map((a) => (
              <Link
                key={a.id}
                href={`/candidate/articles/${a.id}`}
                className="signet-article-card"
              >
                {a.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="thumb" src={a.image} alt={a.title} />
                )}
                <div className="body">
                  <h3>{a.title}</h3>
                  <p>{a.subtitle || a.author}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
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
