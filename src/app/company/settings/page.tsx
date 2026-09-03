"use client";
import AuthGate from "@/app/components/signet/auth-gate";
import AccountSettings from "@/app/components/signet/account-settings";
import Wrapper from "@/layouts/wrapper";

export default function CompanySettingsPage() {
  return (
    <Wrapper>
      <AuthGate role="company">
        <AccountSettings role="company" />
      </AuthGate>
    </Wrapper>
  );
}
