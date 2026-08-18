"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import AuthGate from "@/app/components/signet/auth-gate";
import AppShell from "@/app/components/signet/app-shell";
import { useAuth } from "@/context/auth-context";
import { JOB_TYPES } from "@/lib/job-utils";
import { assertJobOwnedByCompany, updateJob } from "@/lib/services/jobs";
import { uploadJobAttachment } from "@/lib/services/storage";
import SignetTextEditorField from "@/app/components/signet/text-editor-field";
import { FileUploadField, PageLoader } from "@/app/components/signet/shimmer";
import Wrapper from "@/layouts/wrapper";

function Inner() {
  const { user } = useAuth();
  const params = useParams();
  const id = String(params?.id || "");
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [salary, setSalary] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState<string>(JOB_TYPES[0]);
  const [priority, setPriority] = useState("Low");
  const [category, setCategory] = useState("");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState("");
  const [description, setDescription] = useState("");
  const [roles, setRoles] = useState("");
  const [status, setStatus] = useState("Active");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        const job = await assertJobOwnedByCompany(id, user.uid);
        if (!job) {
          toast.error("Job not found or you don’t have access.");
          router.replace("/company/jobs");
          return;
        }
        setTitle(job.title);
        setSalary(job.salary);
        setLocation(job.location);
        setType(job.type || JOB_TYPES[0]);
        setPriority(job.priority || "Low");
        setCategory(job.category || "");
        setExperience(job.experience || "");
        setSkills((job.skills || []).join(", "));
        setDescription(job.description || "");
        setRoles(job.rolesAndResponsibilities || "");
        setStatus(job.status || "Active");
        setAttachmentUrl(job.attachmentUrl || "");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user, router]);

  if (loading) {
    return (
      <AppShell role="company" title="Edit job">
        <PageLoader label="Loading job…" />
      </AppShell>
    );
  }

  return (
    <AppShell role="company" title="Edit job">
      <form
        className="signet-panel"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!user) return;
          setSaving(true);
          try {
            let nextAttachment = attachmentUrl;
            if (attachment) {
              setUploading(true);
              nextAttachment = await uploadJobAttachment(user.uid, id, attachment);
              setUploading(false);
            }
            await updateJob(id, user.uid, {
              title,
              salary,
              location,
              type,
              priority,
              category,
              experience,
              skills: skills
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
              description,
              rolesAndResponsibilities: roles,
              status,
              attachmentUrl: nextAttachment,
            });
            toast.success("Job updated.");
            router.push("/company/jobs");
          } catch {
            toast.error("Could not update job.");
          } finally {
            setUploading(false);
            setSaving(false);
          }
        }}
      >
        <div className="signet-field">
          <label>Job title</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="row">
          <div className="col-md-6">
            <div className="signet-field">
              <label>Salary</label>
              <input required value={salary} onChange={(e) => setSalary(e.target.value)} />
            </div>
          </div>
          <div className="col-md-6">
            <div className="signet-field">
              <label>Location</label>
              <input required value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-3">
            <div className="signet-field">
              <label>Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                {JOB_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="col-md-3">
            <div className="signet-field">
              <label>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
          </div>
          <div className="col-md-3">
            <div className="signet-field">
              <label>Category</label>
              <input value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
          </div>
          <div className="col-md-3">
            <div className="signet-field">
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option>Active</option>
                <option>Closed</option>
                <option>Draft</option>
              </select>
            </div>
          </div>
        </div>
        <div className="signet-field">
          <label>Experience</label>
          <input value={experience} onChange={(e) => setExperience(e.target.value)} />
        </div>
        <div className="signet-field">
          <label>Skills (comma separated)</label>
          <input value={skills} onChange={(e) => setSkills(e.target.value)} />
        </div>
        <SignetTextEditorField
          label="Description"
          required
          value={description}
          onChange={setDescription}
          placeholder="Describe the role, team, and what success looks like…"
        />
        <div className="signet-field">
          <label>Roles & responsibilities</label>
          <textarea value={roles} onChange={(e) => setRoles(e.target.value)} />
        </div>
        <FileUploadField
          label="Attachment"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          uploading={uploading}
          uploadLabel="Uploading attachment…"
          selectedFileName={attachment?.name}
          formatsHint="PDF, DOC, or image"
          currentLabel={
            attachmentUrl ? (
              <a href={attachmentUrl} target="_blank" rel="noreferrer">
                Current attachment
              </a>
            ) : null
          }
          onFile={async (f) => setAttachment(f)}
        />
        <button
          className="signet-btn w-100"
          disabled={saving || uploading}
          type="submit"
        >
          {saving || uploading ? (
            <>
              <span className="signet-spinner sm" />
              {uploading ? "Uploading…" : "Saving…"}
            </>
          ) : (
            "Save changes"
          )}
        </button>
      </form>
    </AppShell>
  );
}

export default function EditJobPage() {
  return (
    <Wrapper>
      <AuthGate role="company">
        <Inner />
      </AuthGate>
    </Wrapper>
  );
}
