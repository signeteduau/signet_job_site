export type EmailContent = {
  subject: string;
  html: string;
  text: string;
};

type LayoutOpts = {
  title: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function layout({ title, body, ctaLabel, ctaUrl }: LayoutOpts): {
  html: string;
  text: string;
} {
  const ctaHtml =
    ctaLabel && ctaUrl
      ? `<p style="margin:24px 0 0;">
          <a href="${ctaUrl}" style="color:#2550eb;font-weight:700;text-decoration:underline;">${ctaLabel}</a>
        </p>`
      : "";

  const ctaText =
    ctaLabel && ctaUrl ? `\n\n${ctaLabel}: ${ctaUrl}` : "";

  const bodyHtml = body.trim();
  const html = `<!DOCTYPE html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:24px;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#1f2430;">
    <div style="max-width:560px;margin:0 auto;">
      <p style="margin:0 0 20px;font-size:14px;color:#717b9e;">Signet Employment Hub</p>
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;font-weight:700;color:#1f2430;">${title}</h1>
      <div style="font-size:15px;line-height:1.65;color:#3f4654;">${bodyHtml}</div>
      ${ctaHtml}
      <hr style="margin:28px 0 16px;border:none;border-top:1px solid #e7eaf3;" />
      <p style="margin:0;font-size:13px;line-height:1.5;color:#717b9e;">
        This is a service notification from Signet Employment Hub.<br />
        Reply to this email if you need help.
      </p>
    </div>
  </body>
</html>`;

  const text = `${title}\n\n${stripHtml(bodyHtml)}${ctaText}\n\n—\nSignet Employment Hub\nThis is a service notification. Reply if you need help.`;

  return { html, text };
}

function build(
  subject: string,
  layoutOpts: LayoutOpts
): EmailContent {
  const { html, text } = layout(layoutOpts);
  return { subject, html, text };
}

export function welcomeEmail(opts: {
  name: string;
  userType?: string;
  appUrl: string;
}): EmailContent {
  const isCompany = opts.userType === "company";

  if (isCompany) {
    return build(`Your Signet employer account is ready`, {
      title: `Welcome, ${opts.name}`,
      body: `<p>Your employer account on Signet Employment Hub is active.</p>
        <p>From your dashboard you can:</p>
        <ul style="margin:0;padding-left:20px;line-height:1.7;">
          <li>Post and manage job listings</li>
          <li>Review applications from candidates</li>
          <li>Schedule interviews and update hiring status</li>
          <li>Message applicants directly</li>
        </ul>
        <p>Complete your company profile so candidates can learn more about your business.</p>`,
      ctaLabel: "Go to employer dashboard",
      ctaUrl: `${opts.appUrl}/company`,
    });
  }

  return build(`Your Signet candidate account is ready`, {
    title: `Welcome, ${opts.name}`,
    body: `<p>Your candidate account on Signet Employment Hub is active.</p>
      <p>From your dashboard you can:</p>
      <ul style="margin:0;padding-left:20px;line-height:1.7;">
        <li>Browse and save jobs</li>
        <li>Upload your resume and complete your profile</li>
        <li>Apply to roles with one profile</li>
        <li>Track application status and interviews</li>
      </ul>
      <p>Complete your profile to stand out to employers.</p>`,
    ctaLabel: "Browse jobs",
    ctaUrl: `${opts.appUrl}/jobs`,
  });
}

export function candidateAppliedEmail(opts: {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  appUrl: string;
}): EmailContent {
  return build(`Application received: ${opts.jobTitle}`, {
    title: "We received your application",
    body: `<p>Hi ${opts.candidateName},</p>
      <p>Your application for <strong>${opts.jobTitle}</strong> at <strong>${opts.companyName}</strong> was submitted successfully.</p>
      <p>The employer will review your profile and resume. We will email you when the status changes.</p>`,
    ctaLabel: "View my applications",
    ctaUrl: `${opts.appUrl}/candidate/my-jobs`,
  });
}

export function companyNewApplicationEmail(opts: {
  companyName: string;
  candidateName: string;
  jobTitle: string;
  appUrl: string;
}): EmailContent {
  return build(`New applicant for ${opts.jobTitle}`, {
    title: "New candidate application",
    body: `<p>Hi ${opts.companyName},</p>
      <p><strong>${opts.candidateName}</strong> applied for your job listing <strong>${opts.jobTitle}</strong>.</p>
      <p>Review their profile, resume, and application details in your employer dashboard.</p>`,
    ctaLabel: "Review applicants",
    ctaUrl: `${opts.appUrl}/company/applications`,
  });
}

export function interviewScheduledEmail(opts: {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  interviewDate?: string;
  interviewTime?: string;
  appUrl: string;
}): EmailContent {
  const when = [opts.interviewDate, opts.interviewTime].filter(Boolean).join(" at ");
  return build(`Interview scheduled for ${opts.jobTitle}`, {
    title: "Your interview has been scheduled",
    body: `<p>Hi ${opts.candidateName},</p>
      <p><strong>${opts.companyName}</strong> scheduled an interview for <strong>${opts.jobTitle}</strong>.</p>
      ${when ? `<p><strong>Date and time:</strong> ${when}</p>` : "<p>Sign in to your dashboard for full interview details.</p>"}
      <p>Good luck — we hope it goes well.</p>`,
    ctaLabel: "View application details",
    ctaUrl: `${opts.appUrl}/candidate/my-jobs`,
  });
}

export function applicationAcceptedEmail(opts: {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  appUrl: string;
}): EmailContent {
  return build(`Update on your application: ${opts.jobTitle}`, {
    title: "Your application was accepted",
    body: `<p>Hi ${opts.candidateName},</p>
      <p><strong>${opts.companyName}</strong> accepted your application for <strong>${opts.jobTitle}</strong>.</p>
      <p>The employer may contact you directly with next steps.</p>`,
    ctaLabel: "View application details",
    ctaUrl: `${opts.appUrl}/candidate/my-jobs`,
  });
}

export function applicationRejectedEmail(opts: {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  rejectionReason?: string;
  appUrl: string;
}): EmailContent {
  return build(`Update on your application: ${opts.jobTitle}`, {
    title: "Application status update",
    body: `<p>Hi ${opts.candidateName},</p>
      <p>Thank you for applying to <strong>${opts.jobTitle}</strong> at <strong>${opts.companyName}</strong>.</p>
      <p>After review, your application was not progressed on this occasion.</p>
      ${opts.rejectionReason ? `<p><strong>Employer note:</strong> ${opts.rejectionReason}</p>` : ""}
      <p>There are other open roles on Signet that may be a better fit.</p>`,
    ctaLabel: "Browse more jobs",
    ctaUrl: `${opts.appUrl}/jobs`,
  });
}

export function jobCancelledEmail(opts: {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  appUrl: string;
}): EmailContent {
  return build(`Job listing closed: ${opts.jobTitle}`, {
    title: "A job you applied to has closed",
    body: `<p>Hi ${opts.candidateName},</p>
      <p>The listing for <strong>${opts.jobTitle}</strong> at <strong>${opts.companyName}</strong> has been closed by the employer.</p>
      <p>If you already applied, the employer may still follow up with you directly.</p>`,
    ctaLabel: "Browse open jobs",
    ctaUrl: `${opts.appUrl}/jobs`,
  });
}

export function jobClosedCompanyEmail(opts: {
  companyName: string;
  jobTitle: string;
  appUrl: string;
}): EmailContent {
  return build(`Job listing closed: ${opts.jobTitle}`, {
    title: "Your job listing is now closed",
    body: `<p>Hi ${opts.companyName},</p>
      <p>Your job listing <strong>${opts.jobTitle}</strong> has been marked as closed on Signet Employment Hub.</p>
      <p>Applicants who already applied have been notified. You can still review their profiles in your dashboard.</p>`,
    ctaLabel: "View applicants",
    ctaUrl: `${opts.appUrl}/company/applications`,
  });
}
