import Link from "next/link";
import Wrapper from "@/layouts/wrapper";

export const metadata = {
  title: "Terms of use | Signet Employment Hub",
};

export default function TermsPage() {
  return (
    <Wrapper>
      <div className="signet-auth-wrap">
        <div className="signet-auth-card" style={{ maxWidth: 720 }}>
          <p className="signet-eyebrow">Legal</p>
          <h2>Terms of use</h2>
          <p>
            Signet Employment Hub connects candidates and employers. By using the
            site or app you agree to provide accurate information, respect other
            users, and use the platform only for lawful recruitment activity.
          </p>
          <p>
            Job listings and profiles are provided by users. Hands On Recruitment /
            Signet may moderate content, suspend accounts for misuse, and update
            these terms with notice on this page.
          </p>
          <p>
            For hiring decisions, employers remain responsible for compliance with
            applicable employment laws.
          </p>
          <Link href="/" className="signet-btn mt-2">
            Back to site
          </Link>
        </div>
      </div>
    </Wrapper>
  );
}
