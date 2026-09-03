"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import AppShell from "@/app/components/signet/app-shell";
import DeleteAccountPanel from "@/app/components/signet/delete-account-panel";
import { useAuth } from "@/context/auth-context";

type Tab = "account" | "social" | "delete";

const SOCIAL_FIELDS = [
  {
    key: "linkedinUrl",
    label: "LinkedIn",
    placeholder: "linkedin.com/in/your-profile",
  },
  {
    key: "instagramUrl",
    label: "Instagram",
    placeholder: "instagram.com/yourhandle",
  },
  {
    key: "facebookUrl",
    label: "Facebook",
    placeholder: "facebook.com/yourpage",
  },
  {
    key: "twitterUrl",
    label: "X / Twitter",
    placeholder: "x.com/yourhandle",
  },
  {
    key: "website",
    label: "Website",
    placeholder: "yourwebsite.com",
  },
] as const;

type SocialKey = (typeof SOCIAL_FIELDS)[number]["key"];

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function AccountPanel() {
  const { user, changePassword, resetPassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <div className="signet-panel">
      <p className="signet-settings-email">{user?.email}</p>

      <h3 className="signet-settings-title">Password</h3>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          try {
            await changePassword(currentPassword, newPassword);
            toast.success("Password updated.");
            setCurrentPassword("");
            setNewPassword("");
          } catch {
            toast.error("Could not change password. Check your current password.");
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="signet-field">
          <label>Current password</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div className="signet-field">
          <label>New password</label>
          <input
            type="password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <button className="signet-btn w-100" disabled={saving} type="submit">
          {saving ? "Updating…" : "Update password"}
        </button>
      </form>
      <button
        type="button"
        className="signet-settings-link-btn"
        onClick={async () => {
          if (!user?.email) return;
          try {
            await resetPassword(user.email);
            toast.success("Password reset email sent.");
          } catch {
            toast.error("Could not send reset email.");
          }
        }}
      >
        Email me a reset link
      </button>

      <hr className="signet-settings-rule" />

      <h3 className="signet-settings-title">Help</h3>
      <div className="signet-settings-plain-links">
        <Link href="/support">Support</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
      </div>
    </div>
  );
}

function SocialPanel() {
  const { profile, saveProfile } = useAuth();
  const [values, setValues] = useState<Record<SocialKey, string>>({
    linkedinUrl: "",
    instagramUrl: "",
    facebookUrl: "",
    twitterUrl: "",
    website: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValues({
      linkedinUrl: profile?.linkedinUrl || "",
      instagramUrl: profile?.instagramUrl || "",
      facebookUrl: profile?.facebookUrl || "",
      twitterUrl: profile?.twitterUrl || "",
      website: profile?.website || "",
    });
  }, [profile]);

  return (
    <form
      className="signet-panel"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
          await saveProfile({
            linkedinUrl: normalizeUrl(values.linkedinUrl),
            instagramUrl: normalizeUrl(values.instagramUrl),
            facebookUrl: normalizeUrl(values.facebookUrl),
            twitterUrl: normalizeUrl(values.twitterUrl),
            website: normalizeUrl(values.website),
          });
          toast.success("Social handles saved.");
        } catch {
          toast.error("Could not save social handles.");
        } finally {
          setSaving(false);
        }
      }}
    >
      <h3 className="signet-settings-title">Social handles</h3>
      <p className="signet-settings-hint">Optional. Leave blank to hide.</p>
      {SOCIAL_FIELDS.map((field) => (
        <div key={field.key} className="signet-field">
          <label>{field.label}</label>
          <input
            type="text"
            inputMode="url"
            value={values[field.key]}
            placeholder={field.placeholder}
            onChange={(e) =>
              setValues((current) => ({
                ...current,
                [field.key]: e.target.value,
              }))
            }
          />
        </div>
      ))}
      <button className="signet-btn w-100" disabled={saving} type="submit">
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

export default function AccountSettings({
  role,
}: {
  role: "candidate" | "company";
}) {
  const [tab, setTab] = useState<Tab>("account");

  return (
    <AppShell role={role} title="Settings">
      <div className="signet-settings-tabs" role="tablist">
        {(
          [
            ["account", "Account"],
            ["social", "Social"],
            ["delete", "Delete"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? "is-active" : ""}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "account" && <AccountPanel />}
      {tab === "social" && <SocialPanel />}
      {tab === "delete" && (
        <div className="signet-panel signet-settings-delete">
          <DeleteAccountPanel embed />
        </div>
      )}
    </AppShell>
  );
}
