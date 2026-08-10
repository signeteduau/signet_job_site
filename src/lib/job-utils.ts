/** Normalize job type labels across Flutter ("Full Time") and web ("Full-time"). */
export function normalizeJobType(type?: string): string {
  return (type || "")
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const JOB_TYPES = [
  "Full Time",
  "Part Time",
  "Contract",
  "Internship",
  "Remote",
] as const;

/** Show "/mo" only when salary looks monthly and doesn't already say so. */
export function salarySuffix(salary?: string): string | null {
  const s = (salary || "").trim();
  if (!s) return null;
  const lower = s.toLowerCase();
  if (
    /\/\s*(mo|month|yr|year|hr|hour|wk|week)/.test(lower) ||
    /\b(per|\/)\s*(month|year|hour|week|annum|annually)\b/.test(lower) ||
    /\b(hourly|weekly|yearly|annual|p\.?a\.?)\b/.test(lower)
  ) {
    return null;
  }
  // Currency-looking amounts without cadence → assume monthly (app default)
  if (/[\d$£€]/.test(s)) return "/mo";
  return null;
}

export function formatAppliedDate(value: unknown): string {
  if (!value) return "";
  try {
    // Firestore Timestamp
    const anyVal = value as { toDate?: () => Date; seconds?: number };
    const date =
      typeof anyVal.toDate === "function"
        ? anyVal.toDate()
        : typeof anyVal.seconds === "number"
        ? new Date(anyVal.seconds * 1000)
        : new Date(String(value));
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}
