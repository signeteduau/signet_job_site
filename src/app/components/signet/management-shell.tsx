"use client";
import React from "react";
import AuthGate from "@/app/components/signet/auth-gate";
import AppShell from "@/app/components/signet/app-shell";
import ManagementGate from "@/app/components/signet/management-gate";
import { useAuth } from "@/context/auth-context";
import Wrapper from "@/layouts/wrapper";

export default function ManagementShell({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const { profile } = useAuth();
  const role = profile?.userType === "company" ? "company" : "candidate";

  return (
    <ManagementGate>
      <AppShell role={role} title={title} subtitle={subtitle}>
        {children}
      </AppShell>
    </ManagementGate>
  );
}

export function ManagementPageFrame({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Wrapper>
      <AuthGate>
        <ManagementShell title={title} subtitle={subtitle}>
          {children}
        </ManagementShell>
      </AuthGate>
    </Wrapper>
  );
}
