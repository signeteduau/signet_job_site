type LayoutOpts = {
  title: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

function layout({ title, body, ctaLabel, ctaUrl }: LayoutOpts): string {
  const cta =
    ctaLabel && ctaUrl
      ? `<p style="margin:28px 0 0;">
          <a href="${ctaUrl}" style="display:inline-block;background:#2550eb;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:700;">
            ${ctaLabel}
          </a>
        </p>`
      : "";

  return `<!DOCTYPE html>
<html>
  <body style="margin:0;background:#f4f6fb;font-family:Arial,sans-serif;color:#1f2430;">
    <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
      <div style="background:#fff;border:1px solid #e7eaf3;border-radius:18px;padding:28px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#2550eb;">Signet Employment Hub</p>
        <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;">${title}</h1>
        <div style="font-size:15px;line-height:1.7;color:#3f4654;">${body}</div>
        ${cta}
      </div>
      <p style="margin:16px 0 0;text-align:center;font-size:12px;color:#717b9e;">
        Questions? Reply to this email or contact signeteduau@gmail.com
      </p>
    </div>
  </body>
</html>`;
}

export function welcomeEmail(name: string, appUrl: string) {
  return {
    subject: "Welcome to Signet Employment Hub",
    html: layout({
      title: `Welcome, ${name}!`,
      body: `<p>Your Signet Employment Hub account is ready.</p>
        <p>Browse jobs, complete your profile, apply with your resume, and track applications from one place.</p>`,
      ctaLabel: "Explore jobs",
      ctaUrl: `${appUrl}/jobs`,
    }),
  };
}

export function candidateAppliedEmail(opts: {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  appUrl: string;
}) {
  return {
    subject: `Application submitted: ${opts.jobTitle}`,
    html: layout({
      title: "Your application was received",
      body: `<p>Hi ${opts.candidateName},</p>
        <p>We received your application for <strong>${opts.jobTitle}</strong> at <strong>${opts.companyName}</strong>.</p>
        <p>The employer will review your profile and resume. You will be notified when your application status changes.</p>`,
      ctaLabel: "View my applications",
      ctaUrl: `${opts.appUrl}/candidate/my-jobs`,
    }),
  };
}

export function companyNewApplicationEmail(opts: {
  companyName: string;
  candidateName: string;
  jobTitle: string;
  appUrl: string;
  jobId: string;
}) {
  return {
    subject: `New application: ${opts.jobTitle}`,
    html: layout({
      title: "New job application",
      body: `<p>Hi ${opts.companyName},</p>
        <p><strong>${opts.candidateName}</strong> applied for <strong>${opts.jobTitle}</strong>.</p>
        <p>Review the application in your Signet dashboard.</p>`,
      ctaLabel: "Review applications",
      ctaUrl: `${opts.appUrl}/company/applications`,
    }),
  };
}

export function interviewScheduledEmail(opts: {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  interviewDate?: string;
  interviewTime?: string;
  appUrl: string;
}) {
  const when = [opts.interviewDate, opts.interviewTime].filter(Boolean).join(" at ");
  return {
    subject: `Interview scheduled: ${opts.jobTitle}`,
    html: layout({
      title: "Interview scheduled",
      body: `<p>Hi ${opts.candidateName},</p>
        <p><strong>${opts.companyName}</strong> scheduled an interview for <strong>${opts.jobTitle}</strong>.</p>
        ${when ? `<p><strong>When:</strong> ${when}</p>` : "<p>Check your Signet dashboard for interview details.</p>"}
        <p>Good luck with your interview.</p>`,
      ctaLabel: "View application",
      ctaUrl: `${opts.appUrl}/candidate/my-jobs`,
    }),
  };
}

export function applicationAcceptedEmail(opts: {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  appUrl: string;
}) {
  return {
    subject: `Congratulations — ${opts.jobTitle}`,
    html: layout({
      title: "Application accepted",
      body: `<p>Hi ${opts.candidateName},</p>
        <p>Great news! <strong>${opts.companyName}</strong> accepted your application for <strong>${opts.jobTitle}</strong>.</p>
        <p>The employer may contact you directly with next steps.</p>`,
      ctaLabel: "View application",
      ctaUrl: `${opts.appUrl}/candidate/my-jobs`,
    }),
  };
}

export function applicationRejectedEmail(opts: {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  rejectionReason?: string;
  appUrl: string;
}) {
  return {
    subject: `Application update: ${opts.jobTitle}`,
    html: layout({
      title: "Application not successful",
      body: `<p>Hi ${opts.candidateName},</p>
        <p>Thank you for applying to <strong>${opts.jobTitle}</strong> at <strong>${opts.companyName}</strong>.</p>
        <p>On this occasion your application was not successful.</p>
        ${opts.rejectionReason ? `<p><strong>Feedback:</strong> ${opts.rejectionReason}</p>` : ""}
        <p>Keep exploring other roles on Signet.</p>`,
      ctaLabel: "Browse jobs",
      ctaUrl: `${opts.appUrl}/jobs`,
    }),
  };
}

export function jobCancelledEmail(opts: {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  appUrl: string;
}) {
  return {
    subject: `Job closed: ${opts.jobTitle}`,
    html: layout({
      title: "Job listing closed",
      body: `<p>Hi ${opts.candidateName},</p>
        <p>The role <strong>${opts.jobTitle}</strong> at <strong>${opts.companyName}</strong> is no longer accepting applications or has been closed by the employer.</p>
        <p>If you already applied, the employer may still contact you directly.</p>`,
      ctaLabel: "Browse other jobs",
      ctaUrl: `${opts.appUrl}/jobs`,
    }),
  };
}
