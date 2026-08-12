"use client";
import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PageLoader } from "@/app/components/signet/shimmer";
import { useAuth } from "@/context/auth-context";
import { buildLoginUrl, withReturnUrl } from "@/lib/auth-flow";
import { UserType } from "@/types/firestore";

export default function AuthGate({
  children,
  role,
  requireProfile = true,
}: {
  children: React.ReactNode;
  role?: UserType;
  requireProfile?: boolean;
}) {
  const { user, profile, loading, homePath } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    const currentUrl =
      typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : pathname;

    if (!user) {
      router.replace(buildLoginUrl(currentUrl));
      return;
    }
    if (!user.emailVerified) {
      router.replace(withReturnUrl("/verify-email", currentUrl));
      return;
    }
    if (!profile) {
      router.replace(withReturnUrl("/role-select", currentUrl));
      return;
    }
    if (requireProfile && !profile.profileCompleted) {
      router.replace(withReturnUrl("/profile-setup", currentUrl));
      return;
    }
    if (role && profile.userType !== role) {
      router.replace(homePath);
    }
  }, [user, profile, loading, role, requireProfile, router, homePath, pathname]);

  if (loading || !user) {
    return <PageLoader label="Loading…" />;
  }

  if (
    !user.emailVerified ||
    !profile ||
    (requireProfile && !profile.profileCompleted) ||
    (role && profile.userType !== role)
  ) {
    return <PageLoader label="Redirecting…" />;
  }

  return <>{children}</>;
}
