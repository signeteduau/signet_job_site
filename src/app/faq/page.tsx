import Link from "next/link";
import Wrapper from "@/layouts/wrapper";
import PublicSiteNav from "@/app/components/signet/public-site-nav";
import { SIGNET_SUPPORT_EMAIL } from "@/lib/contact";

export const metadata = {
  title: "FAQs | Signet Employment Hub",
  description:
    "Answers about Signet accounts, job applications, posting roles, and support.",
};

const FAQ_GROUPS = [
  {
    id: "candidates",
    title: "For candidates",
    icon: "bi-person-badge",
    items: [
      {
        q: "How do I create a candidate account?",
        a: "Register as a candidate, verify your email, then complete your profile. You can start browsing jobs right away.",
      },
      {
        q: "How do I find jobs in my trade?",
        a: "Search from the home page or open Jobs. You can also choose a field such as Automotive, Business, Building & Construction, Community Service, Fabrication and Manufacturing, GE, or Health.",
      },
      {
        q: "What do I need before I can apply?",
        a: "Add a phone number, address, and resume to your profile. Signet will show anything still missing before you send an application.",
      },
      {
        q: "How do I apply for a job?",
        a: "Open a listing and tap Apply. Your profile and resume go to the employer so they can review your experience in one place.",
      },
      {
        q: "Can I save jobs and message employers?",
        a: "Yes. Sign in to save roles from the job list. After you apply, you can keep the conversation going in Messages if the employer writes back.",
      },
    ],
  },
  {
    id: "employers",
    title: "For employers",
    icon: "bi-briefcase",
    items: [
      {
        q: "How do I post a job?",
        a: "Register as a company, then open Post a job. Add the role, location, and what success looks like so candidates know if they are a fit.",
      },
      {
        q: "How do I review applications?",
        a: "Open Applications from your company dashboard to browse candidate profiles, resumes, and experience for each listing.",
      },
      {
        q: "How do messaging and interviews work?",
        a: "From an application you can start a chat, ask follow-up questions, and arrange an interview inside Signet.",
      },
      {
        q: "Can I hire more than one person from Signet?",
        a: "Yes. Keep your listings active, review new applications as they come in, and hire when you find the right person.",
      },
    ],
  },
  {
    id: "account",
    title: "Account & support",
    icon: "bi-shield-check",
    items: [
      {
        q: "How do I update my profile or social links?",
        a: "Open Settings from your dashboard. You can edit account details, add LinkedIn or other social links, and manage deletion from there.",
      },
      {
        q: "How do I delete my account?",
        a: "Go to Settings → Delete, or use the Delete account page. Account information under our control is removed when you confirm.",
      },
      {
        q: "How do I get help or report an issue?",
        a: "Open Support for general help, or Report an issue to send details by email. Include your account email and a short description of what went wrong.",
      },
    ],
  },
] as const;

export default function FaqPage() {
  return (
    <Wrapper>
      <div className="nk-site nk-faq-page">
        <PublicSiteNav variant="browse" />

        <main>
          <section className="nk-faq-hero">
            <div className="nk-container">
              <p className="nk-faq-kicker">Help center</p>
              <h1>Frequently asked questions</h1>
              <p className="nk-faq-lead">
                Quick answers for candidates and employers using Signet Employment Hub.
              </p>
              <nav className="nk-faq-jump" aria-label="FAQ topics">
                {FAQ_GROUPS.map((group) => (
                  <a key={group.id} href={`#${group.id}`}>
                    <i className={`bi ${group.icon}`} aria-hidden />
                    {group.title}
                  </a>
                ))}
              </nav>
            </div>
          </section>

          <section className="nk-faq-body">
            <div className="nk-container nk-faq-stack">
              {FAQ_GROUPS.map((group) => (
                <div key={group.id} id={group.id} className="nk-faq-group">
                  <h2>
                    <span className="nk-faq-group-icon" aria-hidden>
                      <i className={`bi ${group.icon}`} />
                    </span>
                    {group.title}
                  </h2>
                  <div className="nk-faq-list">
                    {group.items.map((item) => (
                      <details key={item.q} className="nk-faq-item">
                        <summary>
                          <span>{item.q}</span>
                          <i className="bi bi-chevron-down" aria-hidden />
                        </summary>
                        <p>{item.a}</p>
                      </details>
                    ))}
                  </div>
                </div>
              ))}

              <div className="nk-faq-help">
                <div>
                  <strong>Still need help?</strong>
                  <p>
                    Contact support and we&apos;ll assist with your account, applications, or listings.
                  </p>
                </div>
                <div className="nk-faq-help-actions">
                  <a
                    href={`mailto:${SIGNET_SUPPORT_EMAIL}`}
                    className="nk-btn nk-btn-register"
                  >
                    Email support
                  </a>
                  <Link href="/support" className="nk-btn nk-btn-ghost">
                    Support
                  </Link>
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
