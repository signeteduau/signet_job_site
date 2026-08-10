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
    <AppShell role="company" title="Chat">
      <ChatList uid={user.uid} role="company" />
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
