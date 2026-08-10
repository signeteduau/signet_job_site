"use client";
import AuthGate from "@/app/components/signet/auth-gate";
import AppShell from "@/app/components/signet/app-shell";
import NotificationsPanel from "@/app/components/signet/notifications-panel";
import { useAuth } from "@/context/auth-context";
import Wrapper from "@/layouts/wrapper";

function Inner() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <AppShell role="candidate" title="Notifications">
      <NotificationsPanel uid={user.uid} role="candidate" />
    </AppShell>
  );
}

export default function CandidateNotificationsPage() {
  return (
    <Wrapper>
      <AuthGate role="candidate">
        <Inner />
      </AuthGate>
    </Wrapper>
  );
}
