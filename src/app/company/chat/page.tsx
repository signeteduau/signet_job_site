"use client";
import AuthGate from "@/app/components/signet/auth-gate";
import AppShell from "@/app/components/signet/app-shell";
import ChatList from "@/app/components/signet/chat-list";
import { useAuth } from "@/context/auth-context";
import { useActingCompany } from "@/lib/hooks/use-acting-company";
import Wrapper from "@/layouts/wrapper";

function Inner() {
  const { user } = useAuth();
  const { companyId, companyName, isActing } = useActingCompany();
  if (!user || !companyId) return null;
  return (
    <AppShell
      role="company"
      title="Messages"
      subtitle={
        isActing
          ? `Conversations for ${companyName}`
          : "Reply to candidates and keep hiring conversations in one place."
      }
    >
      <ChatList uid={companyId} role="company" />
    </AppShell>
  );
}

export default function CompanyChatPage() {
  return (
    <Wrapper>
      <AuthGate role="company">
        <Inner />
      </AuthGate>
    </Wrapper>
  );
}
