import nodemailer from "nodemailer";
import * as admin from "firebase-admin";
import { EMAIL_FROM, SMTP_USER } from "./config";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(smtpPass: string) {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: SMTP_USER.value(),
        pass: smtpPass,
      },
    });
  }
  return transporter;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  smtpPass: string;
  meta?: Record<string, string>;
}): Promise<void> {
  const to = opts.to.trim().toLowerCase();
  if (!to) return;

  await getTransporter(opts.smtpPass).sendMail({
    from: EMAIL_FROM.value(),
    to,
    subject: opts.subject,
    html: opts.html,
  });

  try {
    await admin.firestore().collection("emailLogs").add({
      to,
      subject: opts.subject,
      ...opts.meta,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch {
    /* logging is best-effort */
  }
}

export async function getUserEmail(uid: string): Promise<{
  email: string;
  fullName: string;
  userType?: string;
} | null> {
  const snap = await admin.firestore().doc(`users/${uid}`).get();
  if (!snap.exists) return null;
  const data = snap.data() || {};
  const email = String(data.email || "").trim();
  if (!email) return null;
  return {
    email,
    fullName: String(data.fullName || data.companyName || "User"),
    userType: data.userType ? String(data.userType) : undefined,
  };
}
