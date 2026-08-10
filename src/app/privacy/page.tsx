import Link from "next/link";
import Wrapper from "@/layouts/wrapper";

export const metadata = {
  title: "Privacy policy | Signet Employment Hub",
};

export default function PrivacyPage() {
  return (
    <Wrapper>
      <div className="signet-auth-wrap">
        <div className="signet-auth-card" style={{ maxWidth: 720 }}>
          <p className="signet-eyebrow">Legal</p>
          <h2>Privacy policy</h2>
          <p>
            We collect account details, profile information, resumes you upload,
            job applications, and messages needed to operate Signet Employment Hub.
          </p>
          <p>
            Data is stored with Firebase (Auth, Firestore, Storage). We use it to
            power matching, applications, chat, and notifications. We do not sell
            your personal information.
          </p>
          <p>
            You can update or delete profile content from your account settings.
            Contact support if you need help with a data request.
          </p>
          <Link href="/" className="signet-btn mt-2">
            Back to site
          </Link>
        </div>
      </div>
    </Wrapper>
  );
}
