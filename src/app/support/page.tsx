import Link from "next/link";
import Wrapper from "@/layouts/wrapper";
import PublicSiteNav from "@/app/components/signet/public-site-nav";
import { SIGNET_SUPPORT_EMAIL } from "@/lib/contact";

export const metadata = {
  title: "Support | Signet Employment Hub",
  description:
    "Get help with your Signet account, applications, job listings, or profile.",
};

const TOPICS = [
  {
    title: "Account & login",
    desc: "Email verification, password help, and signing in as a candidate or employer.",
    icon: "bi-person-lock",
  },
  {
    title: "Jobs & applications",
    desc: "Posting roles, applying, saved jobs, and what employers see on your application.",
    icon: "bi-briefcase",
  },
  {
    title: "Profile & resume",
    desc: "Photo, address, resume upload, company logo, and anything blocking an apply.",
    icon: "bi-file-earmark-person",
  },
  {
    title: "Account deletion",
    desc: "Remove your Signet account and the personal data we hold for it.",
    icon: "bi-trash",
    href: "/delete-account",
    action: "Delete account",
  },
] as const;

export default function SupportPage() {
  return (
    <Wrapper>
      <div className="nk-site nk-faq-page">
        <PublicSiteNav variant="browse" />

        <main>
          <section className="nk-faq-hero">
            <div className="nk-container">
              <p className="nk-faq-kicker">Help center</p>
              <h1>Support</h1>
              <p className="nk-faq-lead">
                Need help with your Signet account, applications, or company
                listings? We&apos;ll assist.
              </p>
              <nav className="nk-faq-jump" aria-label="Help pages">
                <Link href="/faq">
                  <i className="bi bi-question-circle" aria-hidden />
                  FAQs
                </Link>
                <Link href="/report">
                  <i className="bi bi-flag" aria-hidden />
                  Report an issue
                </Link>
              </nav>
            </div>
          </section>

          <section className="nk-faq-body">
            <div className="nk-container nk-faq-stack">
              <div className="nk-help-cards">
                {TOPICS.map((topic) => (
                  <article key={topic.title} className="nk-help-card">
                    <span className="nk-faq-group-icon" aria-hidden>
                      <i className={`bi ${topic.icon}`} />
                    </span>
                    <strong>{topic.title}</strong>
                    <p>{topic.desc}</p>
                    {"href" in topic && topic.href ? (
                      <Link href={topic.href}>{topic.action}</Link>
                    ) : null}
                  </article>
                ))}
              </div>

              <div className="nk-help-contact">
                <div>
                  <p className="nk-faq-kicker">Contact</p>
                  <h2>Email the Signet team</h2>
                  <p>
                    Include your account email and a short description of what you
                    need. We usually reply to{" "}
                    <a href={`mailto:${SIGNET_SUPPORT_EMAIL}`}>
                      {SIGNET_SUPPORT_EMAIL}
                    </a>
                    .
                  </p>
                </div>
                <div className="nk-faq-help-actions">
                  <a
                    href={`mailto:${SIGNET_SUPPORT_EMAIL}`}
                    className="nk-btn nk-btn-register"
                  >
                    Email support
                  </a>
                  <Link href="/report" className="nk-btn nk-btn-ghost">
                    Report an issue
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </Wrapper>
  );
}
