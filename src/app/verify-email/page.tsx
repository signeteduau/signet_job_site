"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { reload } from "firebase/auth";
import AuthShell from "@/app/components/signet/auth-shell";
import { PageLoader } from "@/app/components/signet/shimmer";
import { useAuth } from "@/context/auth-context";
import { resolvePostLoginPath } from "@/lib/auth-flow";
import { getUserProfile } from "@/lib/services/users";
import Wrapper from "@/layouts/wrapper";

function VerifyEmailInner() {
  const { user, sendVerification, logout } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const returnUrl = search?.get("returnUrl");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    const id = setInterval(async () => {
      try {
        await reload(user);
        if (user.emailVerified) {
          const p = await getUserProfile(user.uid);
          router.replace(resolvePostLoginPath(p, user, returnUrl));
        }
      } catch {
        /* ignore */
      }
    }, 4000);
    return () => clearInterval(id);
  }, [user, router, returnUrl]);

  return (
    <Wrapper>
      <AuthShell
        showTabs={false}
        title="Verify your email"
        subtitle="Open the link we sent, then this page continues automatically."
      >
        <div className="signet-auth-note">
          <i className="bi bi-envelope-check" />
          <div>
            Sent to <strong>{user?.email}</strong>
          </div>
        </div>
        <button
          className="signet-btn w-100"
          disabled={sending}
          onClick={async () => {
            setSending(true);
            try {
              await sendVerification();
              toast.success("Verification email sent.");
            } catch {
              toast.error("Could not resend email.");
            } finally {
              setSending(false);
            }
          }}
        >
          {sending ? "Sending…" : "Resend email"}
        </button>
        <button
          className="signet-btn secondary w-100 mt-2"
          onClick={async () => {
            await logout();
            router.push("/login");
          }}
        >
          Use a different account
        </button>
      </AuthShell>
    </Wrapper>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<PageLoader label="Loading…" />}>
      <VerifyEmailInner />
    </Suspense>
  );
}
