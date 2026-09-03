"use client";
import { useParams } from "next/navigation";
import AuthGate from "@/app/components/signet/auth-gate";
import AppShell from "@/app/components/signet/app-shell";
import ChatDetail from "@/app/components/signet/chat-detail";
import { useAuth } from "@/context/auth-context";
import { useActingCompany } from "@/lib/hooks/use-acting-company";
import Wrapper from "@/layouts/wrapper";

function Inner() {
  const { user } = useAuth();
  const { companyId } = useActingCompany();
  const params = useParams();
  const id = String(params?.id || "");
  if (!user || !companyId) return null;
  return (
    <AppShell role="company">
      <ChatDetail chatId={id} uid={companyId} role="company" />
    </AppShell>
  );
}

export default function CompanyChatDetailPage() {
  return (
    <Wrapper>
      <AuthGate role="company">
        <Inner />
      </AuthGate>
    </Wrapper>
  );
}
