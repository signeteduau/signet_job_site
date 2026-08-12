"use client";
import AuthGate from "@/app/components/signet/auth-gate";
import AppShell from "@/app/components/signet/app-shell";
import ChatList from "@/app/components/signet/chat-list";
import { useAuth } from "@/context/auth-context";
import Wrapper from "@/layouts/wrapper";

function Inner() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <AppShell
      role="candidate"
      title="Messages"
      subtitle="Stay in touch with employers about roles and applications."
    >
      <ChatList uid={user.uid} role="candidate" />
    </AppShell>
  );
}

export default function CandidateChatPage() {
  return (
    <Wrapper>
      <AuthGate role="candidate">
        <Inner />
      </AuthGate>
    </Wrapper>
  );
}
