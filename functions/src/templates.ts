import {
  bulletList,
  escapeHtml,
  infoBox,
  renderEmailLayout,
} from "./email-layout";

export type EmailContent = {
  subject: string;
  html: string;
  text: string;
};

function build(
  subject: string,
  opts: Parameters<typeof renderEmailLayout>[0]
): EmailContent {
  const { html, text } = renderEmailLayout(opts);
  return { subject, html, text };
}

export function verificationEmail(opts: {
  name: string;
  verifyLink: string;
  appUrl: string;
}): EmailContent {
  const safeName = escapeHtml(opts.name);
  return build("Verify your Signet email address", {
    preheader: "Confirm your email to activate your Signet account",
    badge: "Email verification",
    title: "Verify your email",
    appUrl: opts.appUrl,
    body: `<p>Hi ${safeName},</p>
      <p>Thanks for joining <strong>Signet Employment Hub</strong>. Please confirm your email address to secure your account and continue.</p>
      ${infoBox("<strong>This link expires soon.</strong> If you did not create an account, you can ignore this email.")}
      <p style="margin:16px 0 0;font-size:13px;line-height:1.6;word-break:break-all;color:#8b93a7;">If the button does not work, copy and paste this link:<br /><a href="${opts.verifyLink}" style="color:#2550eb;">${opts.verifyLink}</a></p>`,
    ctaLabel: "Verify email address",
    ctaUrl: opts.verifyLink,
  });
}

export function welcomeEmail(opts: {
  name: string;
  userType?: string;
  appUrl: string;
}): EmailContent {
  const safeName = escapeHtml(opts.name);
  const isCompany = opts.userType === "company";

  if (isCompany) {
    return build("Welcome to Signet — employer account ready", {
      preheader: "Your employer dashboard is ready on Signet",
      badge: "Welcome employer",
      title: `Welcome, ${safeName}`,
      appUrl: opts.appUrl,
      body: `<p>Your employer account is now active on Signet Employment Hub.</p>
        <p>From your dashboard you can:</p>
        ${bulletList([
          "Post and manage job listings",
          "Review applications from candidates",
          "Schedule interviews and update hiring status",
          "Message applicants directly",
        ])}
        <p style="margin-top:16px;">Complete your company profile so candidates can learn more about your business.</p>`,
      ctaLabel: "Go to employer dashboard",
      ctaUrl: `${opts.appUrl}/company`,
    });
  }

  return build("Welcome to Signet — candidate account ready", {
    preheader: "Start browsing jobs on Signet Employment Hub",
    badge: "Welcome candidate",
    title: `Welcome, ${safeName}`,
    appUrl: opts.appUrl,
    body: `<p>Your candidate account is now active on Signet Employment Hub.</p>
      <p>From your dashboard you can:</p>
      ${bulletList([
        "Browse and save jobs",
        "Upload your resume and complete your profile",
        "Apply to roles with one profile",
        "Track application status and interviews",
      ])}
      <p style="margin-top:16px;">Complete your profile to stand out to employers.</p>`,
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
    preheader: `Your application to ${opts.companyName} was submitted`,
    badge: "Application update",
    title: "Application submitted successfully",
    appUrl: opts.appUrl,
    body: `<p>Hi ${escapeHtml(opts.candidateName)},</p>
      ${infoBox(`<strong>${escapeHtml(opts.jobTitle)}</strong><br />${escapeHtml(opts.companyName)}`)}
      <p>The employer will review your profile and resume. We will email you when your application status changes.</p>`,
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
  return build(`New applicant: ${opts.jobTitle}`, {
    preheader: `${opts.candidateName} applied for ${opts.jobTitle}`,
    badge: "New application",
    title: "A candidate applied to your job",
    appUrl: opts.appUrl,
    body: `<p>Hi ${escapeHtml(opts.companyName)},</p>
      ${infoBox(`<strong>${escapeHtml(opts.candidateName)}</strong> applied for<br /><strong>${escapeHtml(opts.jobTitle)}</strong>`)}
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
  return build(`Interview scheduled: ${opts.jobTitle}`, {
    preheader: `${opts.companyName} scheduled your interview`,
    badge: "Interview update",
    title: "Your interview is scheduled",
    appUrl: opts.appUrl,
    body: `<p>Hi ${escapeHtml(opts.candidateName)},</p>
      <p><strong>${escapeHtml(opts.companyName)}</strong> scheduled an interview for <strong>${escapeHtml(opts.jobTitle)}</strong>.</p>
      ${when ? infoBox(`<strong>Date &amp; time</strong><br />${escapeHtml(when)}`) : infoBox("Sign in to your dashboard for full interview details.")}
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
  return build(`Great news: ${opts.jobTitle}`, {
    preheader: `Your application was accepted by ${opts.companyName}`,
    badge: "Application accepted",
    title: "Congratulations — you were accepted",
    appUrl: opts.appUrl,
    body: `<p>Hi ${escapeHtml(opts.candidateName)},</p>
      ${infoBox(`<strong>${escapeHtml(opts.companyName)}</strong> accepted your application for<br /><strong>${escapeHtml(opts.jobTitle)}</strong>`)}
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
  return build(`Application update: ${opts.jobTitle}`, {
    preheader: `Update on your application to ${opts.companyName}`,
    badge: "Application update",
    title: "Application status update",
    appUrl: opts.appUrl,
    body: `<p>Hi ${escapeHtml(opts.candidateName)},</p>
      <p>Thank you for applying to <strong>${escapeHtml(opts.jobTitle)}</strong> at <strong>${escapeHtml(opts.companyName)}</strong>.</p>
      <p>After review, your application was not progressed on this occasion.</p>
      ${opts.rejectionReason ? infoBox(`<strong>Employer note</strong><br />${escapeHtml(opts.rejectionReason)}`) : ""}
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
  return build(`Job closed: ${opts.jobTitle}`, {
    preheader: `${opts.companyName} closed the ${opts.jobTitle} listing`,
    badge: "Job update",
    title: "A job you applied to has closed",
    appUrl: opts.appUrl,
    body: `<p>Hi ${escapeHtml(opts.candidateName)},</p>
      ${infoBox(`<strong>${escapeHtml(opts.jobTitle)}</strong><br />${escapeHtml(opts.companyName)}`)}
      <p>This listing has been closed by the employer. If you already applied, they may still follow up with you directly.</p>`,
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
    preheader: `Your job listing ${opts.jobTitle} is now closed`,
    badge: "Job update",
    title: "Your job listing is closed",
    appUrl: opts.appUrl,
    body: `<p>Hi ${escapeHtml(opts.companyName)},</p>
      <p>Your job listing <strong>${escapeHtml(opts.jobTitle)}</strong> has been marked as closed on Signet Employment Hub.</p>
      <p>Applicants who already applied have been notified. You can still review their profiles in your dashboard.</p>`,
    ctaLabel: "View applicants",
    ctaUrl: `${opts.appUrl}/company/applications`,
  });
}
