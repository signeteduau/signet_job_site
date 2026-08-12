"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useAuth } from "@/context/auth-context";
import {
  buildLoginUrl,
  isCandidateActionReady,
  resolvePostLoginPath,
} from "@/lib/auth-flow";

type RequireAuthOptions = {
  returnUrl?: string;
  message?: string;
  role?: "candidate" | "company";
};

export function useRequireAuth() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const requireAuth = useCallback(
    (opts?: RequireAuthOptions) => {
      const returnUrl =
        opts?.returnUrl ??
        (typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : pathname);

      if (loading) return false;

      if (!user) {
        toast.info(opts?.message ?? "Sign in to continue", {
          toastId: "auth-required",
        });
        router.push(buildLoginUrl(returnUrl));
        return false;
      }

      const next = resolvePostLoginPath(profile, user, returnUrl);
      const ready =
        opts?.role === "company"
          ? !!profile?.profileCompleted && profile.userType === "company"
          : isCandidateActionReady(profile, user);

      if (!ready) {
        if (next !== returnUrl) {
          toast.info("Complete your profile to continue", {
            toastId: "auth-profile",
          });
          router.push(next);
        }
        return false;
      }

      if (opts?.role === "candidate" && profile?.userType !== "candidate") {
        toast.error("This action is for job seekers.");
        return false;
      }

      if (opts?.role === "company" && profile?.userType !== "company") {
        toast.error("This action is for employers.");
        return false;
      }

      return true;
    },
    [user, profile, loading, router, pathname]
  );

  return {
    user,
    profile,
    loading,
    requireAuth,
    isLoggedIn: !!user,
    isCandidateReady: isCandidateActionReady(profile, user),
  };
}
