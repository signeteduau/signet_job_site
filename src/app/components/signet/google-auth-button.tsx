"use client";

import React, { useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "@/context/auth-context";
import {
  getGoogleAuthErrorMessage,
  isGoogleRedirectInProgress,
} from "@/lib/google-auth";
import { UserType } from "@/types/firestore";

type Props = {
  mode: "login" | "signup";
  userType?: UserType;
  companyName?: string;
  returnUrl?: string | null;
  onSuccess: () => void | Promise<void>;
  onBeforeSignIn?: () => boolean;
  className?: string;
};

export default function GoogleAuthButton({
  mode,
  userType,
  companyName,
  returnUrl,
  onSuccess,
  onBeforeSignIn,
  className = "signet-btn google w-100",
}: Props) {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const label =
    mode === "signup"
      ? loading
        ? "Creating account…"
        : "Sign up with Google"
      : loading
      ? "Connecting…"
      : "Continue with Google";

  return (
    <button
      type="button"
      className={className}
      disabled={loading}
      onClick={async () => {
        if (onBeforeSignIn && !onBeforeSignIn()) {
          return;
        }
        setLoading(true);
        let redirecting = false;
        try {
          await loginWithGoogle({
            userType: mode === "signup" ? userType : undefined,
            companyName: mode === "signup" ? companyName : undefined,
            returnUrl,
          });
          if (mode === "signup") {
            toast.success("Signed up with Google!");
          }
          await onSuccess();
        } catch (err) {
          if (isGoogleRedirectInProgress(err)) {
            redirecting = true;
            return;
          }
          toast.error(getGoogleAuthErrorMessage(err));
        } finally {
          if (!redirecting) {
            setLoading(false);
          }
        }
      }}
    >
      <i className="bi bi-google" aria-hidden />
      {label}
    </button>
  );
}
