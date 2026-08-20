import { Suspense } from "react";
import LegalDocumentPage from "@/app/components/signet/legal-document-page";
import { termsAndConditions } from "@/content/legal/terms-and-conditions";

export const metadata = {
  title: "Terms and Conditions | Signet Employment Hub",
  description:
    "Terms and Conditions for Signet Employment Hub (SEH / Signet Jobs) mobile application, website and related services.",
};

function TermsFallback() {
  return (
    <div className="signet-legal-shell">
      <div className="signet-legal-doc">
        <p className="signet-legal-loading">Loading terms and conditions…</p>
      </div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <Suspense fallback={<TermsFallback />}>
      <LegalDocumentPage document={termsAndConditions} />
    </Suspense>
  );
}
