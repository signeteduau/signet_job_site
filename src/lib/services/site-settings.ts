import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type LegalSiteContent = {
  privacyPolicy: string;
  termsAndConditions: string;
};

const EMPTY_LEGAL: LegalSiteContent = {
  privacyPolicy: "",
  termsAndConditions: "",
};

export async function fetchLegalContent(): Promise<LegalSiteContent> {
  try {
    const snap = await getDoc(doc(db, "siteSettings", "legal"));
    if (!snap.exists()) return EMPTY_LEGAL;
    const data = snap.data();
    return {
      privacyPolicy:
        data.privacyPolicy ||
        data.privacyContent ||
        data.privacy ||
        "",
      termsAndConditions:
        data.termsAndConditions ||
        data.termsContent ||
        data.terms ||
        "",
    };
  } catch {
    return EMPTY_LEGAL;
  }
}
