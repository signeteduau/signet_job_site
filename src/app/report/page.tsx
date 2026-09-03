import Link from "next/link";
import Wrapper from "@/layouts/wrapper";
import PublicSiteNav from "@/app/components/signet/public-site-nav";
import ReportIssueForm from "@/app/components/signet/report-issue-form";
import { SIGNET_SUPPORT_EMAIL } from "@/lib/contact";

export const metadata = {
  title: "Report an issue | Signet Employment Hub",
  description:
    "Report a problem with Signet accounts, jobs, applications, or messaging.",
};

export default function ReportPage() {
  return (
    <Wrapper>
      <div className="nk-site nk-faq-page">
        <PublicSiteNav variant="browse" />

        <main>
          <section className="nk-faq-hero">
            <div className="nk-container">
              <p className="nk-faq-kicker">Help center</p>
              <h1>Report an issue</h1>
              <p className="nk-faq-lead">
                Tell us what went wrong and we&apos;ll follow up by email.
              </p>
              <nav className="nk-faq-jump" aria-label="Help pages">
                <Link href="/faq">
                  <i className="bi bi-question-circle" aria-hidden />
                  FAQs
                </Link>
                <Link href="/support">
                  <i className="bi bi-life-preserver" aria-hidden />
                  Support
                </Link>
              </nav>
            </div>
          </section>

          <section className="nk-faq-body">
            <div className="nk-container nk-help-split">
              <div className="nk-help-panel">
                <h2>Send a report</h2>
                <p>
                  Include your account email and enough detail for us to reproduce
                  the problem.
                </p>
                <ReportIssueForm />
              </div>
              <aside className="nk-help-aside">
                <strong>What to include</strong>
                <ul>
                  <li>The page or job you were using</li>
                  <li>What you expected to happen</li>
                  <li>What happened instead</li>
                  <li>Your Signet account email</li>
                </ul>
                <p>
                  You can also email{" "}
                  <a href={`mailto:${SIGNET_SUPPORT_EMAIL}`}>
                    {SIGNET_SUPPORT_EMAIL}
                  </a>{" "}
                  directly.
                </p>
              </aside>
            </div>
          </section>
        </main>
      </div>
    </Wrapper>
  );
}
