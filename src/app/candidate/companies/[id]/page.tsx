"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import AuthGate from "@/app/components/signet/auth-gate";
import AppShell from "@/app/components/signet/app-shell";
import JobCard from "@/app/components/signet/job-card";
import { JobListShimmer, PanelShimmer } from "@/app/components/signet/shimmer";
import { useAuth } from "@/context/auth-context";
import {
  fetchCompanyProfile,
  followCompany,
  isFollowingCompany,
  unfollowCompany,
} from "@/lib/services/companies";
import { fetchCompanyJobs } from "@/lib/services/jobs";
import { openOrCreateChat } from "@/lib/services/chat";
import { AppUser, Job } from "@/types/firestore";
import Wrapper from "@/layouts/wrapper";
import ProfileSocialLinks from "@/app/components/signet/profile-social-links";

function Inner() {
  const params = useParams();
  const id = String(params?.id || "");
  const { user, profile } = useAuth();
  const router = useRouter();
  const [company, setCompany] = useState<AppUser | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const c = await fetchCompanyProfile(id);
        setCompany(c);
        setJobs(await fetchCompanyJobs(id));
        if (user) setFollowing(await isFollowingCompany(user.uid, id));
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user]);

  if (loading) {
    return (
      <AppShell role="candidate" title="Company">
        <>
          <PanelShimmer rows={4} />
          <JobListShimmer count={3} />
        </>
      </AppShell>
    );
  }

  if (!company) {
    return (
      <AppShell role="candidate" title="Company">
        <div className="signet-empty"><h4>Company not found</h4></div>
      </AppShell>
    );
  }

  const name = company.companyName || company.fullName || "Company";

  return (
    <AppShell role="candidate" title={name}>
      <div className="signet-panel">
        <div className="d-flex gap-3 align-items-start flex-wrap">
          <div className="signet-logo-tile signet-logo-tile--xl">
            {(company.logoUrl || company.profileImage) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logoUrl || company.profileImage} alt={name} />
            ) : (
              <span>{name.charAt(0)}</span>
            )}
          </div>
          <div className="flex-grow-1">
            <h2 style={{ color: "#12141A", fontWeight: 800, margin: 0 }}>{name}</h2>
            <div className="signet-tags mt-2">
              {company.industry && <span>{company.industry}</span>}
              {(company.companyLocation || company.address) && (
                <span>{company.companyLocation || company.address}</span>
              )}
              {company.companySize && <span>{company.companySize}</span>}
            </div>
            {company.website && (
              <a href={company.website} target="_blank" rel="noreferrer" style={{ color: "#004CF0" }}>
                {company.website}
              </a>
            )}
            <ProfileSocialLinks profile={company} />
            <p className="mt-2" style={{ color: "#6B7280" }}>
              {company.about || "No company description yet."}
            </p>
            <div className="d-flex flex-wrap gap-2 mt-3">
              <button
                className="signet-btn"
                onClick={async () => {
                  if (!user || !profile) return;
                  try {
                    const chatId = await openOrCreateChat({
                      currentUser: profile,
                      otherUserId: id,
                    });
                    router.push(`/candidate/chat/${chatId}`);
                  } catch {
                    toast.error("Could not open chat.");
                  }
                }}
              >
                Message
              </button>
              <button
                className={`signet-btn ${following ? "secondary" : ""}`}
                onClick={async () => {
                  if (!user) return;
                  try {
                    if (following) {
                      await unfollowCompany(user.uid, id);
                      setFollowing(false);
                    } else {
                      await followCompany(user.uid, {
                        companyId: id,
                        companyName: name,
                        logoUrl: company.logoUrl || company.profileImage,
                      });
                      setFollowing(true);
                    }
                  } catch {
                    toast.error("Could not update follow.");
                  }
                }}
              >
                {following ? "Following" : "Follow"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <h3 className="mt-4 mb-3" style={{ color: "#12141A", fontWeight: 700 }}>
        Open roles
      </h3>
      {jobs.length === 0 && (
        <div className="signet-empty signet-panel">
          <h4>No open roles</h4>
        </div>
      )}
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} href={`/jobs/${job.id}`} />
      ))}
      <Link href="/jobs" className="signet-btn secondary mt-2">
        Browse all jobs
      </Link>
    </AppShell>
  );
}

export default function CompanyDetailPage() {
  return (
    <Wrapper>
      <AuthGate role="candidate">
        <Inner />
      </AuthGate>
    </Wrapper>
  );
}
