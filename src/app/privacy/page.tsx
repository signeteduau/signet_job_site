import { Suspense } from "react";
import LegalDocumentPage from "@/app/components/signet/legal-document-page";
import { privacyPolicy } from "@/content/legal/privacy-policy";

export const metadata = {
  title: "Privacy Policy | Signet Employment Hub",
  description:
    "Privacy Policy for Signet Employment Hub (SEH / Signet Jobs) mobile application, website and related services.",
};

function PrivacyFallback() {
  return (
    <div className="signet-legal-shell">
      <div className="signet-legal-doc">
        <p className="signet-legal-loading">Loading privacy policy…</p>
      </div>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <Suspense fallback={<PrivacyFallback />}>
      <LegalDocumentPage document={privacyPolicy} />
    </Suspense>
  );
}
