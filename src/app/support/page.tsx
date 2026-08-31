import Link from "next/link";
import Wrapper from "@/layouts/wrapper";
import { SIGNET_SUPPORT_EMAIL } from "@/lib/contact";

export const metadata = {
  title: "Support | Signet Employment Hub",
};

export default function SupportPage() {
  return (
    <Wrapper>
      <div className="signet-auth-wrap">
        <div className="signet-auth-card" style={{ maxWidth: 720 }}>
          <p className="signet-eyebrow">Help</p>
          <h2>Support</h2>
          <p>
            Need help with your Signet account, applications, or company
            listings? Contact Signet Employment Hub support and we&apos;ll
            assist.
          </p>
          <ul style={{ color: "#5B6475", lineHeight: 1.7 }}>
            <li>Account access &amp; email verification</li>
            <li>Job posting and applications</li>
            <li>Profile, resume, or company logo issues</li>
            <li>Account deletion requests</li>
          </ul>
          <p>
            Email{" "}
            <a href={`mailto:${SIGNET_SUPPORT_EMAIL}`}>{SIGNET_SUPPORT_EMAIL}</a>
          </p>
          <p>
            To delete your account, visit{" "}
            <Link href="/delete-account">Delete account</Link>.
          </p>
          <Link href="/" className="signet-btn mt-2">
            Back to site
          </Link>
        </div>
      </div>
    </Wrapper>
  );
}
