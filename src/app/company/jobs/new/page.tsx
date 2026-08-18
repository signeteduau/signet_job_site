"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import AuthGate from "@/app/components/signet/auth-gate";
import AppShell from "@/app/components/signet/app-shell";
import { useAuth } from "@/context/auth-context";
import { JOB_TYPES } from "@/lib/job-utils";
import { createJob, updateJob } from "@/lib/services/jobs";
import { uploadJobAttachment } from "@/lib/services/storage";
import SignetTextEditorField from "@/app/components/signet/text-editor-field";
import { FileUploadField } from "@/app/components/signet/shimmer";
import Wrapper from "@/layouts/wrapper";

function NewJobInner() {
  const { user, profile } = useAuth();
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
  const [attachment, setAttachment] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  return (
    <AppShell role="company" title="Create vacancy">
      <form
        className="signet-panel"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!user) return;
          setSaving(true);
          try {
            const jobId = await createJob({
              companyId: user.uid,
              companyName: profile?.companyName || profile?.fullName || "Company",
              logoUrl: profile?.logoUrl || profile?.profileImage || "",
              title,
              salary,
              location,
              type,
              category,
              experience,
              skills: skills
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
              description,
              rolesAndResponsibilities: roles,
              priority,
              currency: "AUD",
            });
            if (attachment) {
              setUploading(true);
              const url = await uploadJobAttachment(user.uid, jobId, attachment);
              await updateJob(jobId, user.uid, { attachmentUrl: url });
              setUploading(false);
            }
            toast.success("Job posted!");
            router.push("/company/jobs");
          } catch (err) {
            console.error(err);
            toast.error("Could not create job. Try again or check Firebase rules.");
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
              <input
                required
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="$80k – $100k / month"
              />
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
          <div className="col-md-4">
            <div className="signet-field">
              <label>Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                {JOB_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="col-md-4">
            <div className="signet-field">
              <label>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
          </div>
          <div className="col-md-4">
            <div className="signet-field">
              <label>Category</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Engineering"
              />
            </div>
          </div>
        </div>
        <div className="signet-field">
          <label>Experience</label>
          <input
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            placeholder="2+ years"
          />
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
          label="Attachment (optional)"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          uploading={uploading}
          uploadLabel="Uploading attachment…"
          selectedFileName={attachment?.name}
          formatsHint="PDF, DOC, or image"
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
              {uploading ? "Uploading…" : "Publishing…"}
            </>
          ) : (
            "Publish job"
          )}
        </button>
      </form>
    </AppShell>
  );
}

export default function NewJobPage() {
  return (
    <Wrapper>
      <AuthGate role="company">
        <NewJobInner />
      </AuthGate>
    </Wrapper>
  );
}
