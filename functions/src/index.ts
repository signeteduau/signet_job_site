import * as admin from "firebase-admin";
import {
  onDocumentCreated,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import { APP_URL, SMTP_PASS } from "./config";
import { getUserEmail, sendEmail } from "./email";
import {
  applicationAcceptedEmail,
  applicationRejectedEmail,
  candidateAppliedEmail,
  companyNewApplicationEmail,
  interviewScheduledEmail,
  jobCancelledEmail,
  welcomeEmail,
} from "./templates";

admin.initializeApp();

const CLOSED_STATUSES = new Set(["closed", "cancelled", "canceled", "inactive"]);

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function isClosedStatus(status: unknown): boolean {
  return CLOSED_STATUSES.has(asString(status).trim().toLowerCase());
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
    const tpl = welcomeEmail(name, APP_URL.value());

    await sendEmail({
      to: email,
      subject: tpl.subject,
      html: tpl.html,
      smtpPass: SMTP_PASS.value(),
      meta: { type: "welcome", userId: event.params.userId },
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

    const candidate = await getUserEmail(applicantId);
    if (candidate?.email) {
      const tpl = candidateAppliedEmail({
        candidateName: candidate.fullName,
        jobTitle,
        companyName,
        appUrl,
      });
      await sendEmail({
        to: candidate.email,
        subject: tpl.subject,
        html: tpl.html,
        smtpPass: SMTP_PASS.value(),
        meta: {
          type: "application_submitted_candidate",
          jobId: event.params.jobId,
          applicantId,
        },
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
          jobId: event.params.jobId,
        });
        await sendEmail({
          to: company.email,
          subject: tpl.subject,
          html: tpl.html,
          smtpPass: SMTP_PASS.value(),
          meta: {
            type: "application_submitted_company",
            jobId: event.params.jobId,
            applicantId,
          },
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
      await sendEmail({
        to: candidate.email,
        subject: tpl.subject,
        html: tpl.html,
        smtpPass,
        meta: {
          type: "interview_scheduled",
          jobId: event.params.jobId,
          applicantId,
        },
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
      await sendEmail({
        to: candidate.email,
        subject: tpl.subject,
        html: tpl.html,
        smtpPass,
        meta: {
          type: "application_accepted",
          jobId: event.params.jobId,
          applicantId,
        },
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
      await sendEmail({
        to: candidate.email,
        subject: tpl.subject,
        html: tpl.html,
        smtpPass,
        meta: {
          type: "application_rejected",
          jobId: event.params.jobId,
          applicantId,
        },
      });
    }
  }
);

/** Notify applicants when a job is closed/cancelled. */
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
    const appUrl = APP_URL.value();
    const smtpPass = SMTP_PASS.value();

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

        await sendEmail({
          to: candidate.email,
          subject: tpl.subject,
          html: tpl.html,
          smtpPass,
          meta: { type: "job_cancelled", jobId, applicantId },
        });
      })
    );
  }
);
