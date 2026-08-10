"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageLoader } from "@/app/components/signet/shimmer";
import { useAuth } from "@/context/auth-context";
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

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!user.emailVerified) {
      router.replace("/verify-email");
      return;
    }
    if (!profile) {
      router.replace("/role-select");
      return;
    }
    if (requireProfile && !profile.profileCompleted) {
      router.replace("/profile-setup");
      return;
    }
    if (role && profile.userType !== role) {
      router.replace(homePath);
    }
  }, [user, profile, loading, role, requireProfile, router, homePath]);

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
