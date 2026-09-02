import { AppUser } from "@/types/firestore";

export type CompletionItem = {
  key: string;
  label: string;
  filled: boolean;
  requiredToApply?: boolean;
};

export type ProfileCompletion = {
  percent: number;
  items: CompletionItem[];
  missing: CompletionItem[];
  applyMissing: string[];
  canApply: boolean;
};

function filledText(value?: string | null): boolean {
  return Boolean(value && value.trim());
}

function filledList(value?: string[] | null): boolean {
  return Boolean(value?.some((item) => item.trim()));
}

export function hasPhone(profile?: AppUser | null): boolean {
  const digits = (profile?.phone || "").replace(/\D/g, "");
  return digits.length >= 8;
}

export function hasAddress(profile?: AppUser | null): boolean {
  if (!profile) return false;
  const city = (profile.city || "").trim();
  const state = (profile.state || "").trim();
  const postcode = (profile.postcode || "").trim();
  const street = (profile.street || "").trim();
  if (city && state && postcode) return true;
  if (street && (city || postcode)) return true;
  const raw = (profile.address || profile.companyLocation || "").trim();
  if (!raw) return false;
  return raw.split(",").map((part) => part.trim()).filter(Boolean).length >= 2;
}

export function hasResume(profile?: AppUser | null): boolean {
  return filledText(profile?.resumeUrl);
}

function candidateItems(profile?: AppUser | null): CompletionItem[] {
  return [
    {
      key: "photo",
      label: "Photo",
      filled: filledText(profile?.profileImage),
    },
    {
      key: "name",
      label: "Full name",
      filled: filledText(profile?.fullName),
    },
    {
      key: "phone",
      label: "Phone number",
      filled: hasPhone(profile),
      requiredToApply: true,
    },
    {
      key: "address",
      label: "Address",
      filled: hasAddress(profile),
      requiredToApply: true,
    },
    {
      key: "occupation",
      label: "Occupation",
      filled: filledText(profile?.occupation),
    },
    {
      key: "experience",
      label: "Experience",
      filled: filledText(profile?.experienceYears),
    },
    {
      key: "skills",
      label: "Skills",
      filled: filledList(profile?.skills),
    },
    {
      key: "about",
      label: "About me",
      filled: filledText(profile?.aboutMe),
    },
    {
      key: "resume",
      label: "Resume",
      filled: hasResume(profile),
      requiredToApply: true,
    },
  ];
}

function companyItems(profile?: AppUser | null): CompletionItem[] {
  return [
    {
      key: "logo",
      label: "Logo",
      filled: filledText(profile?.logoUrl || profile?.profileImage),
    },
    {
      key: "companyName",
      label: "Company name",
      filled: filledText(profile?.companyName),
    },
    {
      key: "contact",
      label: "Contact name",
      filled: filledText(profile?.fullName),
    },
    {
      key: "phone",
      label: "Phone number",
      filled: hasPhone(profile),
    },
    {
      key: "address",
      label: "Address",
      filled: hasAddress(profile),
    },
    {
      key: "industry",
      label: "Industry",
      filled: filledText(profile?.industry),
    },
    {
      key: "website",
      label: "Website",
      filled: filledText(profile?.website),
    },
    {
      key: "size",
      label: "Company size",
      filled: filledText(profile?.companySize),
    },
    {
      key: "about",
      label: "About",
      filled: filledText(profile?.about),
    },
  ];
}

export function formatMissingList(items: string[]): string {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function getProfileCompletion(
  profile?: AppUser | null
): ProfileCompletion {
  const items =
    profile?.userType === "company"
      ? companyItems(profile)
      : candidateItems(profile);
  const filledCount = items.filter((item) => item.filled).length;
  const percent = items.length
    ? Math.round((filledCount / items.length) * 100)
    : 0;
  const missing = items.filter((item) => !item.filled);
  const applyMissing = missing
    .filter((item) => item.requiredToApply)
    .map((item) => item.label.toLowerCase());

  return {
    percent,
    items,
    missing,
    applyMissing,
    canApply: applyMissing.length === 0,
  };
}

export function getApplyRequirements(profile?: AppUser | null): CompletionItem[] {
  return candidateItems(profile).filter((item) => item.requiredToApply);
}

export function applyBlockMessage(profile?: AppUser | null): string | null {
  const { applyMissing } = getProfileCompletion(profile);
  if (!applyMissing.length) return null;
  return `Add your ${formatMissingList(applyMissing)} in Edit profile before applying.`;
}
