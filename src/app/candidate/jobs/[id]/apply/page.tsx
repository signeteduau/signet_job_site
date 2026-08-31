"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import AuthGate from "@/app/components/signet/auth-gate";
import AppShell from "@/app/components/signet/app-shell";
import { FileUploadField, PanelShimmer } from "@/app/components/signet/shimmer";
import PhoneField from "@/app/components/signet/phone-field";
import { useAuth } from "@/context/auth-context";
import {
  DEFAULT_PHONE_COUNTRY_CODE,
  formatFullPhone,
} from "@/lib/phone-country-codes";
import { fetchJobById } from "@/lib/services/jobs";
import { applyToJob, hasApplied } from "@/lib/services/applications";
import { uploadResume, getStorageErrorMessage, validateResumeFile } from "@/lib/services/storage";
import { Job } from "@/types/firestore";
import Wrapper from "@/layouts/wrapper";

function ApplyInner() {
  const params = useParams();
  const id = String(params?.id || "");
  const router = useRouter();
  const { user, profile, saveProfile } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [phoneCountryCode, setPhoneCountryCode] = useState(
    profile?.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE
  );
  const [phone, setPhone] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile?.phone) setPhone(profile.phone);
    if (profile?.phoneCountryCode) setPhoneCountryCode(profile.phoneCountryCode);
  }, [profile?.phone, profile?.phoneCountryCode]);

  useEffect(() => {
    (async () => {
      try {
        const j = await fetchJobById(id);
        setJob(j);
        if (user && j && (await hasApplied(user.uid, j.id))) {
          toast.info("You already applied to this job.");
          router.replace(`/jobs/${j.id}`);
        }
      } catch {
        toast.error("Could not load job.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !job) return;
    if (!file && !profile?.resumeUrl) {
      toast.error("Please upload a resume.");
      return;
    }
    if (file) {
      const fileError = validateResumeFile(file);
      if (fileError) {
        toast.error(fileError);
        return;
      }
    }
    setSubmitting(true);
    try {
      let resumeUrl = profile?.resumeUrl || "";
      let resumeFile = profile?.resumeFileName || "resume.pdf";
      if (file) {
        setUploading(true);
        try {
          const uploaded = await uploadResume(user.uid, job.id, file);
          resumeUrl = uploaded.url;
          resumeFile = uploaded.fileName;
        } catch (err) {
          console.error(err);
          const msg =
            err instanceof Error && !("code" in err)
              ? err.message
              : getStorageErrorMessage(err);
          toast.error(msg);
          return;
        } finally {
          setUploading(false);
        }
        await saveProfile({ resumeUrl, resumeFileName: resumeFile });
      }
      await saveProfile({ phone, phoneCountryCode });
      await applyToJob({
        userId: user.uid,
        job,
        resumeUrl,
        resumeFile,
        phone: formatFullPhone(phoneCountryCode, phone),
      });
      toast.success("Application submitted!");
      router.push("/candidate/my-jobs");
    } catch (err) {
      console.error(err);
      try {
        if (user && job && (await hasApplied(user.uid, job.id))) {
          toast.success("Application submitted!");
          router.push("/candidate/my-jobs");
          return;
        }
      } catch {
        /* ignore recovery check errors */
      }
      toast.error("Could not submit application. Please try again.");
    } finally {
      setUploading(false);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppShell role="candidate" title="Apply">
        <PanelShimmer rows={5} />
      </AppShell>
    );
  }

  if (!job) {
    return (
      <AppShell role="candidate" title="Apply">
        <div className="signet-empty">
          <h4>Job not found</h4>
          <p>This role may have been removed.</p>
          <button
            className="signet-btn mt-2"
            onClick={() => router.push("/jobs")}
          >
            Browse jobs
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="candidate" title={`Apply — ${job.title}`}>
      <form className="signet-panel" onSubmit={onSubmit}>
        <p style={{ color: "#6B7280" }}>
          Applying to{" "}
          <strong style={{ color: "#12141A" }}>{job.companyName}</strong>
        </p>
        <PhoneField
          countryCode={phoneCountryCode}
          phone={phone}
          onCountryCodeChange={setPhoneCountryCode}
          onPhoneChange={setPhone}
          required
        />
        <FileUploadField
          label="Resume (PDF / DOC)"
          accept=".pdf,.doc,.docx"
          uploading={uploading}
          uploadLabel="Uploading resume…"
          hint={
            file
              ? `Selected: ${file.name}`
              : profile?.resumeUrl
              ? `Or reuse saved resume: ${profile.resumeFileName || "resume"}`
              : "Upload a resume to continue"
          }
          onFile={async (f) => setFile(f)}
        />
        <button
          className="signet-btn w-100"
          disabled={submitting || uploading}
          type="submit"
        >
          {submitting || uploading ? (
            <>
              <span className="signet-spinner sm" />
              {uploading ? "Uploading…" : "Submitting…"}
            </>
          ) : (
            "Submit application"
          )}
        </button>
      </form>
    </AppShell>
  );
}

export default function ApplyPage() {
  return (
    <Wrapper>
      <AuthGate role="candidate">
        <ApplyInner />
      </AuthGate>
    </Wrapper>
  );
}
