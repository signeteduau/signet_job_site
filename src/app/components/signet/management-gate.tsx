"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageLoader } from "@/app/components/signet/shimmer";
import { useAuth } from "@/context/auth-context";
import { useIsManagement } from "@/lib/hooks/use-is-management";

export default function ManagementGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading, homePath } = useAuth();
  const router = useRouter();
  const { allowed, loading: checking } = useIsManagement(
    user?.email || profile?.email
  );

  useEffect(() => {
    if (loading || checking) return;
    if (!allowed) router.replace(homePath);
  }, [allowed, checking, loading, router, homePath]);

  if (loading || checking || !allowed) {
    return <PageLoader label="Redirecting…" />;
  }

  return <>{children}</>;
}
