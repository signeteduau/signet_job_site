import { Suspense } from "react";
import Wrapper from "@/layouts/wrapper";
import DeleteAccountPanel from "@/app/components/signet/delete-account-panel";

export const metadata = {
  title: "Delete Account | Signet Employment Hub",
  description:
    "Request deletion of your Signet Employment Hub account and associated personal data.",
};

function DeleteAccountFallback() {
  return (
    <div className="signet-auth-wrap">
      <div className="signet-auth-card" style={{ maxWidth: 720 }}>
        <p className="signet-auth-lead">Loading…</p>
      </div>
    </div>
  );
}

export default function DeleteAccountPage() {
  return (
    <Wrapper>
      <div className="signet-auth-wrap">
        <Suspense fallback={<DeleteAccountFallback />}>
          <DeleteAccountPanel />
        </Suspense>
      </div>
    </Wrapper>
  );
}
