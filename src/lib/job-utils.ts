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

export function formatPostedAgo(value: unknown): string {
  if (!value) return "";
  try {
    const anyVal = value as { toDate?: () => Date; seconds?: number };
    const date =
      typeof anyVal.toDate === "function"
        ? anyVal.toDate()
        : typeof anyVal.seconds === "number"
        ? new Date(anyVal.seconds * 1000)
        : new Date(String(value));
    if (Number.isNaN(date.getTime())) return "";

    const diffMs = Date.now() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Posted just now";
    if (mins < 60) return `Posted ${mins} minute${mins === 1 ? "" : "s"} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Posted ${hrs} hour${hrs === 1 ? "" : "s"} ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `Posted ${days} day${days === 1 ? "" : "s"} ago`;
    return `Posted ${date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}`;
  } catch {
    return "";
  }
}

export function isJobNew(value: unknown, withinDays = 7): boolean {
  if (!value) return false;
  try {
    const anyVal = value as { toDate?: () => Date; seconds?: number };
    const date =
      typeof anyVal.toDate === "function"
        ? anyVal.toDate()
        : typeof anyVal.seconds === "number"
        ? new Date(anyVal.seconds * 1000)
        : new Date(String(value));
    if (Number.isNaN(date.getTime())) return false;
    return Date.now() - date.getTime() < withinDays * 86400000;
  } catch {
    return false;
  }
}

/** Split job description / responsibilities text into display bullet points. */
export function splitJobTextToPoints(text?: string): string[] {
  const raw = (text || "").trim();
  if (!raw) return [];

  const cleanPoint = (line: string) =>
    line
      .replace(/^[\s•·▪◦\-–—*]+/, "")
      .replace(/^\d+[.)]\s*/, "")
      .trim();

  const byNewline = raw
    .split(/\r?\n+/)
    .map(cleanPoint)
    .filter(Boolean);
  if (byNewline.length > 1) return byNewline;

  const byInlineBullet = raw
    .split(/\s*[•·▪◦]\s+|\s+-\s+(?=[A-Za-z0-9])/)
    .map(cleanPoint)
    .filter(Boolean);
  if (byInlineBullet.length > 1) return byInlineBullet;

  const bySemicolon = raw
    .split(/\s*;\s+/)
    .map(cleanPoint)
    .filter(Boolean);
  if (bySemicolon.length > 1) return bySemicolon;

  const single = cleanPoint(raw);
  return single ? [single] : [];
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
