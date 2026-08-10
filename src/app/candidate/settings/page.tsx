"use client";
import React, { useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import AuthGate from "@/app/components/signet/auth-gate";
import AppShell from "@/app/components/signet/app-shell";
import { useAuth } from "@/context/auth-context";
import Wrapper from "@/layouts/wrapper";

function SettingsInner() {
  const { user, changePassword, resetPassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <AppShell role="candidate" title="Settings">
      <div className="signet-panel">
        <h3 style={{ color: "#12141A", fontWeight: 800, marginTop: 0 }}>
          Password
        </h3>
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
          <button className="signet-btn" disabled={saving} type="submit">
            {saving ? "Updating…" : "Update password"}
          </button>
        </form>
        <button
          type="button"
          className="signet-btn secondary mt-3"
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
          Email me a reset link instead
        </button>
      </div>

      <div className="signet-panel">
        <h3 style={{ color: "#12141A", fontWeight: 800, marginTop: 0 }}>
          Help &amp; legal
        </h3>
        <div className="d-flex flex-column gap-2">
          <Link href="/support" className="signet-btn secondary">
            Support
          </Link>
          <Link href="/terms" className="signet-btn secondary">
            Terms of use
          </Link>
          <Link href="/privacy" className="signet-btn secondary">
            Privacy policy
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

export default function CandidateSettingsPage() {
  return (
    <Wrapper>
      <AuthGate role="candidate">
        <SettingsInner />
      </AuthGate>
    </Wrapper>
  );
}
