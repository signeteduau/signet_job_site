import * as admin from "firebase-admin";
import {
  onDocumentCreated,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { APP_URL, SMTP_PASS } from "./config";
import { getUserEmail, sendEmail } from "./email";
import {
  applicationAcceptedEmail,
  applicationRejectedEmail,
  candidateAppliedEmail,
  companyNewApplicationEmail,
  interviewScheduledEmail,
  jobCancelledEmail,
  jobClosedCompanyEmail,
  verificationEmail,
  welcomeEmail,
  type EmailContent,
} from "./templates";

admin.initializeApp();

const CLOSED_STATUSES = new Set(["closed", "cancelled", "canceled", "inactive"]);

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function isClosedStatus(status: unknown): boolean {
  return CLOSED_STATUSES.has(asString(status).trim().toLowerCase());
}

async function dispatchEmail(
  to: string,
  tpl: EmailContent,
  smtpPass: string,
  meta: Record<string, string>
) {
  await sendEmail({
    to,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    smtpPass,
    meta,
  });
}

/** Welcome email when a user profile is created. */
export const sendWelcomeEmail = onDocumentCreated(
  {
    document: "users/{userId}",
    secrets: [SMTP_PASS],
  },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const email = asString(data.email);
    if (!email) return;

    const name = asString(data.fullName || data.companyName, "there");
    const userType = asString(data.userType);
    const tpl = welcomeEmail({
      name,
      userType,
      appUrl: APP_URL.value(),
    });

    await dispatchEmail(email, tpl, SMTP_PASS.value(), {
      type: "welcome",
      userId: event.params.userId,
      userType,
    });
  }
);

/** Candidate + company emails when someone applies to a job. */
export const sendApplicationEmails = onDocumentCreated(
  {
    document: "jobs/{jobId}/applications/{applicantId}",
    secrets: [SMTP_PASS],
  },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const applicantId = event.params.applicantId;
    const jobTitle = asString(data.title, "Job");
    const companyName = asString(data.companyName, "Company");
    const companyId = asString(data.companyId);
    const appUrl = APP_URL.value();
    const smtpPass = SMTP_PASS.value();

    const candidate = await getUserEmail(applicantId);
    if (candidate?.email) {
      const tpl = candidateAppliedEmail({
        candidateName: candidate.fullName,
        jobTitle,
        companyName,
        appUrl,
      });
      await dispatchEmail(candidate.email, tpl, smtpPass, {
        type: "application_submitted_candidate",
        jobId: event.params.jobId,
        applicantId,
      });
    }

    if (companyId) {
      const company = await getUserEmail(companyId);
      if (company?.email) {
        const tpl = companyNewApplicationEmail({
          companyName: company.fullName,
          candidateName: candidate?.fullName || "A candidate",
          jobTitle,
          appUrl,
        });
        await dispatchEmail(company.email, tpl, smtpPass, {
          type: "application_submitted_company",
          jobId: event.params.jobId,
          applicantId,
        });
      }
    }
  }
);

/** Interview, accept (hired), and reject emails on status change. */
export const sendApplicationStatusEmail = onDocumentUpdated(
  {
    document: "jobs/{jobId}/applications/{applicantId}",
    secrets: [SMTP_PASS],
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    const prevStatus = asString(before.status);
    const nextStatus = asString(after.status);
    if (!nextStatus || prevStatus === nextStatus) return;

    const applicantId = event.params.applicantId;
    const candidate = await getUserEmail(applicantId);
    if (!candidate?.email) return;

    const jobTitle = asString(after.title, "Job");
    const companyName = asString(after.companyName, "Company");
    const appUrl = APP_URL.value();
    const smtpPass = SMTP_PASS.value();

    if (nextStatus === "Interview Scheduled") {
      const tpl = interviewScheduledEmail({
        candidateName: candidate.fullName,
        jobTitle,
        companyName,
        interviewDate: asString(after.interviewDate),
        interviewTime: asString(after.interviewTime),
        appUrl,
      });
      await dispatchEmail(candidate.email, tpl, smtpPass, {
        type: "interview_scheduled",
        jobId: event.params.jobId,
        applicantId,
      });
      return;
    }

    if (nextStatus === "Hired") {
      const tpl = applicationAcceptedEmail({
        candidateName: candidate.fullName,
        jobTitle,
        companyName,
        appUrl,
      });
      await dispatchEmail(candidate.email, tpl, smtpPass, {
        type: "application_accepted",
        jobId: event.params.jobId,
        applicantId,
      });
      return;
    }

    if (nextStatus === "Rejected") {
      const tpl = applicationRejectedEmail({
        candidateName: candidate.fullName,
        jobTitle,
        companyName,
        rejectionReason: asString(after.rejectionReason),
        appUrl,
      });
      await dispatchEmail(candidate.email, tpl, smtpPass, {
        type: "application_rejected",
        jobId: event.params.jobId,
        applicantId,
      });
    }
  }
);

/** Notify applicants and employer when a job is closed/cancelled. */
export const sendJobClosedEmails = onDocumentUpdated(
  {
    document: "jobs/{jobId}",
    secrets: [SMTP_PASS],
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    const prevStatus = asString(before.status);
    const nextStatus = asString(after.status);
    if (!isClosedStatus(nextStatus) || isClosedStatus(prevStatus)) return;

    const jobId = event.params.jobId;
    const jobTitle = asString(after.title, "Job");
    const companyName = asString(after.companyName, "Company");
    const companyId = asString(after.companyId);
    const appUrl = APP_URL.value();
    const smtpPass = SMTP_PASS.value();

    if (companyId) {
      const company = await getUserEmail(companyId);
      if (company?.email) {
        const tpl = jobClosedCompanyEmail({
          companyName: company.fullName,
          jobTitle,
          appUrl,
        });
        await dispatchEmail(company.email, tpl, smtpPass, {
          type: "job_closed_company",
          jobId,
        });
      }
    }

    const appsSnap = await admin
      .firestore()
      .collection(`jobs/${jobId}/applications`)
      .get();

    const seen = new Set<string>();
    await Promise.all(
      appsSnap.docs.map(async (appDoc) => {
        const applicantId = appDoc.id;
        if (seen.has(applicantId)) return;
        seen.add(applicantId);

        const candidate = await getUserEmail(applicantId);
        if (!candidate?.email) return;

        const tpl = jobCancelledEmail({
          candidateName: candidate.fullName,
          jobTitle,
          companyName,
          appUrl,
        });

        await dispatchEmail(candidate.email, tpl, smtpPass, {
          type: "job_cancelled_candidate",
          jobId,
          applicantId,
        });
      })
    );
  }
);

/** Branded verification email (replaces default Firebase template). */
export const sendVerificationEmail = onCall(
  { secrets: [SMTP_PASS], cors: true },
  async (request) => {
    if (!request.auth?.token.email) {
      throw new HttpsError("unauthenticated", "Sign in required.");
    }

    const uid = request.auth.uid;
    const user = await admin.auth().getUser(uid);

    if (user.emailVerified) {
      return { ok: true, alreadyVerified: true };
    }

    if (!user.email) {
      throw new HttpsError("failed-precondition", "No email on account.");
    }

    const isPasswordAccount = user.providerData.some(
      (p) => p.providerId === "password"
    );
    if (!isPasswordAccount) {
      throw new HttpsError(
        "failed-precondition",
        "Verification email is only for email/password accounts."
      );
    }

    const appUrl = APP_URL.value();
    const verifyLink = await admin.auth().generateEmailVerificationLink(
      user.email,
      { url: `${appUrl}/verify-email`, handleCodeInApp: false }
    );

    const name = user.displayName || "there";
    const tpl = verificationEmail({
      name,
      verifyLink,
      appUrl,
    });

    await dispatchEmail(user.email, tpl, SMTP_PASS.value(), {
      type: "email_verification",
      userId: uid,
    });

    return { ok: true };
  }
);
