import { defineSecret, defineString } from "firebase-functions/params";

export const SMTP_PASS = defineSecret("SMTP_PASS");

export const SMTP_USER = defineString("SMTP_USER", {
  default: "signeteduau@gmail.com",
});

export const EMAIL_FROM = defineString("EMAIL_FROM", {
  default: "Signet Employment Hub <signeteduau@gmail.com>",
});

export const APP_URL = defineString("APP_URL", {
  default: "https://signetemploymenthub.com",
});

export const SUPPORT_EMAIL = defineString("SUPPORT_EMAIL", {
  default: "signeteduau@gmail.com",
});
