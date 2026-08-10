"use client";
import { useParams } from "next/navigation";
import AuthGate from "@/app/components/signet/auth-gate";
import AppShell from "@/app/components/signet/app-shell";
import ChatDetail from "@/app/components/signet/chat-detail";
import { useAuth } from "@/context/auth-context";
import Wrapper from "@/layouts/wrapper";

function Inner() {
  const { user } = useAuth();
  const params = useParams();
  const id = String(params?.id || "");
  if (!user) return null;
  return (
    <AppShell role="candidate" title="Conversation">
      <ChatDetail chatId={id} uid={user.uid} role="candidate" />
    </AppShell>
  );
}

export default function CandidateChatDetailPage() {
  return (
    <Wrapper>
      <AuthGate role="candidate">
        <Inner />
      </AuthGate>
    </Wrapper>
  );
}
