"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import { buildLoginUrl } from "@/lib/auth-flow";
import { deleteAllUserData } from "@/lib/services/account-deletion";
import { getUserProfile } from "@/lib/services/users";
import { SIGNET_SUPPORT_EMAIL } from "@/lib/contact";
import { notifyError, notifySuccess } from "@/utils/toast";

type Props = {
  embed?: boolean;
};

function isGoogleAccount() {
  const user = auth.currentUser;
  return (
    user?.providerData.some((p) => p.providerId === "google.com") ?? false
  );
}

export default function DeleteAccountPanel({ embed = false }: Props) {
  const router = useRouter();
  const { user, profile, loading, logout } = useAuth();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const providerLabel = useMemo(() => {
    if (!user) return "";
    return isGoogleAccount() ? "Google" : "Email & password";
  }, [user]);

  useEffect(() => {
    if (loading || user || done) return;
    router.replace(buildLoginUrl("/delete-account"));
  }, [loading, user, done, router]);

  async function handleImmediateDelete() {
    if (!user || !confirm) return;
    setBusy(true);
    try {
      if (isGoogleAccount()) {
        await reauthenticateWithPopup(user, new GoogleAuthProvider());
      } else {
        if (!user.email) throw new Error("Account email not found.");
        if (!password.trim()) throw new Error("Enter your password to confirm.");
        const cred = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, cred);
      }

      const userProfile = profile || (await getUserProfile(user.uid));
      await deleteAllUserData(user.uid, userProfile);
      await deleteUser(user);
      await logout();
      setDone(true);
      notifySuccess("Your account has been deleted.");
    } catch (err: unknown) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code?: string }).code)
          : "";
      if (code === "auth/requires-recent-login") {
        notifyError("Please sign in again, then retry account deletion.");
        router.push(buildLoginUrl("/delete-account"));
      } else if (code === "auth/wrong-password") {
        notifyError("Incorrect password. Please try again.");
      } else {
        notifyError(
          err instanceof Error ? err.message : "Could not delete account."
        );
      }
    } finally {
      setBusy(false);
    }
  }

  if (loading || (!user && !done)) {
    return (
      <div className="signet-auth-card" style={{ maxWidth: 720 }}>
        <p className="signet-auth-lead">Loading…</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="signet-auth-card" style={{ maxWidth: 720 }}>
        <p className="signet-eyebrow">Account deleted</p>
        <h2>Your account has been removed</h2>
        <p className="signet-auth-lead">
          Your Signet profile, applications, saved jobs, and chat history under
          our control have been deleted.
        </p>
        {!embed && (
          <Link href="/" className="signet-btn mt-2">
            Back to site
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="signet-auth-card signet-delete-account" style={{ maxWidth: 720 }}>
      <p className="signet-eyebrow">Privacy</p>
      <h2>Delete your Signet account</h2>
      <p className="signet-auth-lead">
        You can delete your account and associated data held by Signet
        Employment Hub. This includes your profile, resume, applications, saved
        jobs, notifications, and in-app messages.
      </p>

      <ul className="signet-delete-account-list">
        <li>Deletion is permanent and cannot be undone.</li>
        <li>
          Copies of applications already downloaded by an employer are not
          automatically removed.
        </li>
        <li>
          Questions? Email{" "}
          <a href={`mailto:${SIGNET_SUPPORT_EMAIL}`}>{SIGNET_SUPPORT_EMAIL}</a>
        </li>
      </ul>

      <div className="signet-delete-account-panel">
        <p className="signet-delete-account-signed-in">
          Signed in as <strong>{user?.email}</strong>
          {providerLabel ? ` (${providerLabel})` : ""}
        </p>

        <label className="signet-delete-account-check">
          <input
            type="checkbox"
            checked={confirm}
            onChange={(e) => setConfirm(e.target.checked)}
          />
          <span>
            I understand this will permanently delete my account and data.
          </span>
        </label>

        {!isGoogleAccount() && (
          <div className="signet-field">
            <label htmlFor="delete-password">Confirm your password</label>
            <input
              id="delete-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>
        )}

        <button
          type="button"
          className="signet-btn danger mt-2"
          disabled={!confirm || busy}
          onClick={handleImmediateDelete}
        >
          {busy ? "Deleting…" : "Delete my account now"}
        </button>
      </div>

      {!embed && (
        <div className="signet-delete-account-links mt-3">
          <Link href="/privacy">Privacy Policy</Link>
          <span aria-hidden> · </span>
          <Link href="/support">Support</Link>
        </div>
      )}
    </div>
  );
}
