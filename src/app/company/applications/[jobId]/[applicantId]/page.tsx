"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import AuthGate from "@/app/components/signet/auth-gate";
import AppShell from "@/app/components/signet/app-shell";
import { PanelShimmer } from "@/app/components/signet/shimmer";
import { useAuth } from "@/context/auth-context";
import { getUserProfile } from "@/lib/services/users";
import {
  fetchJobApplications,
  updateApplicationStatus,
} from "@/lib/services/applications";
import { assertJobOwnedByCompany } from "@/lib/services/jobs";
import { openOrCreateChat } from "@/lib/services/chat";
import { Application, AppUser } from "@/types/firestore";
import Wrapper from "@/layouts/wrapper";

function Inner() {
  const params = useParams();
  const jobId = String(params?.jobId || "");
  const applicantId = String(params?.applicantId || "");
  const { user, profile } = useAuth();
  const router = useRouter();
  const [applicant, setApplicant] = useState<AppUser | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    const apps = await fetchJobApplications(jobId);
    const app = apps.find((a) => (a.userId || a.id) === applicantId) || null;
    setApplication(app);
    if (app?.interviewDate) setInterviewDate(app.interviewDate);
    if (app?.interviewTime) setInterviewTime(app.interviewTime);
    if (app?.rejectionReason) setRejectionReason(app.rejectionReason);
  };

  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        const owned = await assertJobOwnedByCompany(jobId, user.uid);
        if (!owned) {
          toast.error("Job not found or you don’t have access.");
          router.replace("/company/applications");
          return;
        }
        setApplicant(await getUserProfile(applicantId));
        await reload();
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, applicantId, user]);

  if (loading) {
    return (
      <AppShell role="company" title="Applicant">
        <PanelShimmer rows={6} />
      </AppShell>
    );
  }

  return (
    <AppShell role="company" title={applicant?.fullName || "Applicant"}>
      <Link href={`/company/applications?jobId=${jobId}`} className="signet-btn secondary mb-3">
        ← Back to applications
      </Link>

      <div className="signet-panel">
        <div className="d-flex gap-3 align-items-start">
          <div className="signet-logo-tile" style={{ width: 64, height: 64 }}>
            {applicant?.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={applicant.profileImage} alt="" />
            ) : (
              <span>{(applicant?.fullName || "A").charAt(0)}</span>
            )}
          </div>
          <div>
            <h2 style={{ color: "#12141A", fontWeight: 800, margin: 0 }}>
              {applicant?.fullName || applicantId}
            </h2>
            <div style={{ color: "#6B7280" }}>
              {applicant?.occupation || "Candidate"} · {applicant?.email}
            </div>
            <div className="signet-tags mt-2">
              {applicant?.experienceYears && <span>{applicant.experienceYears} yrs</span>}
              {applicant?.phone && <span>{applicant.phone}</span>}
              {applicant?.address && <span>{applicant.address}</span>}
            </div>
            {!!applicant?.skills?.length && (
              <div className="signet-tags mt-2">
                {applicant.skills.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
            )}
            {applicant?.aboutMe && (
              <p className="mt-3" style={{ color: "#6B7280" }}>{applicant.aboutMe}</p>
            )}
          </div>
        </div>
      </div>

      <div className="signet-panel">
        <h4 style={{ color: "#12141A", fontWeight: 700 }}>Application</h4>
        <p style={{ color: "#6B7280" }}>
          Status:{" "}
          <span className="signet-status">{application?.status || "Under Review"}</span>
        </p>
        {application?.resumeUrl && (
          <a
            href={application.resumeUrl}
            target="_blank"
            rel="noreferrer"
            className="signet-btn secondary mb-3"
          >
            View resume
          </a>
        )}

        <div className="row">
          <div className="col-md-6">
            <div className="signet-field">
              <label>Interview date</label>
              <input type="date" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} />
            </div>
          </div>
          <div className="col-md-6">
            <div className="signet-field">
              <label>Interview time</label>
              <input type="time" value={interviewTime} onChange={(e) => setInterviewTime(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="signet-field">
          <label>Rejection reason (if rejecting)</label>
          <input value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button
            className="signet-btn"
            onClick={async () => {
              if (!user) return;
              try {
                await updateApplicationStatus({
                  jobId,
                  companyId: user.uid,
                  applicantId,
                  status: "Interview Scheduled",
                  interviewDate,
                  interviewTime,
                });
                toast.success("Interview scheduled.");
                reload();
              } catch {
                toast.error("Update failed.");
              }
            }}
          >
            Schedule interview
          </button>
          <button
            className="signet-btn secondary"
            onClick={async () => {
              if (!user) return;
              try {
                await updateApplicationStatus({
                  jobId,
                  companyId: user.uid,
                  applicantId,
                  status: "Hired",
                });
                toast.success("Marked as hired.");
                reload();
              } catch {
                toast.error("Update failed.");
              }
            }}
          >
            Hire
          </button>
          <button
            className="signet-btn danger"
            onClick={async () => {
              if (!user) return;
              try {
                await updateApplicationStatus({
                  jobId,
                  companyId: user.uid,
                  applicantId,
                  status: "Rejected",
                  rejectionReason: rejectionReason || "Not a fit at this time",
                });
                toast.success("Rejected.");
                reload();
              } catch {
                toast.error("Update failed.");
              }
            }}
          >
            Reject
          </button>
          <button
            className="signet-btn secondary"
            onClick={async () => {
              if (!user || !profile) return;
              try {
                const chatId = await openOrCreateChat({
                  currentUser: profile,
                  otherUserId: applicantId,
                });
                router.push(`/company/chat/${chatId}`);
              } catch {
                toast.error("Could not open chat.");
              }
            }}
          >
            Message candidate
          </button>
        </div>
      </div>
    </AppShell>
  );
}

export default function ApplicantDetailPage() {
  return (
    <Wrapper>
      <AuthGate role="company">
        <Inner />
      </AuthGate>
    </Wrapper>
  );
}
