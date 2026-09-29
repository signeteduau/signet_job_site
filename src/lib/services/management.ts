import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  DEFAULT_MANAGEMENT_EMAILS,
  DEFAULT_MANAGEMENT_MEMBERS,
  normalizeEmail,
} from "@/lib/management";

const MANAGEMENT_REF = doc(db, "siteSettings", "management");

function emailsFromDoc(data: Record<string, unknown> | undefined): string[] {
  if (!data) return [];
  const emails = Array.isArray(data.emails) ? data.emails : [];
  const members = Array.isArray(data.members) ? data.members : [];
  const fromMembers = members
    .map((item) =>
      item && typeof item === "object" && "email" in item
        ? String((item as { email?: unknown }).email || "")
        : ""
    );
  return Array.from(
    new Set(
      [...emails, ...fromMembers]
        .map((value) => normalizeEmail(String(value || "")))
        .filter(Boolean)
    )
  );
}

export async function fetchManagementEmails(): Promise<string[]> {
  try {
    const snap = await getDoc(MANAGEMENT_REF);
    const emails = emailsFromDoc(snap.data());
    return emails.length ? emails : DEFAULT_MANAGEMENT_EMAILS;
  } catch {
    return DEFAULT_MANAGEMENT_EMAILS;
  }
}

export async function seedManagementSettingsIfMissing(): Promise<void> {
  try {
    const snap = await getDoc(MANAGEMENT_REF);
    if (snap.exists()) return;
    await setDoc(MANAGEMENT_REF, {
      emails: DEFAULT_MANAGEMENT_EMAILS,
      members: DEFAULT_MANAGEMENT_MEMBERS.map((member) => ({
        name: member.name,
        email: member.email,
      })),
      updatedAt: serverTimestamp(),
    });
  } catch {
    /* ignore */
  }
}
