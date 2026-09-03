"use client";
import AuthGate from "@/app/components/signet/auth-gate";
import AccountSettings from "@/app/components/signet/account-settings";
import Wrapper from "@/layouts/wrapper";

export default function CandidateSettingsPage() {
  return (
    <Wrapper>
      <AuthGate role="candidate">
        <AccountSettings role="candidate" />
      </AuthGate>
    </Wrapper>
  );
}
