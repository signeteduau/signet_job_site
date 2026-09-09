export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isSignetJob(job?: {
  isSignetJob?: boolean;
  postedBy?: string;
  hideCompany?: boolean;
  companyId?: string;
  companyName?: string;
  category?: string;
  anzsco?: string;
  type?: string;
  title?: string;
}): boolean {
  if (job?.isSignetJob || job?.postedBy === "admin" || job?.hideCompany) {
    return true;
  }

  const noCompany =
    !(job?.companyId || "").trim() && !(job?.companyName || "").trim();
  if (!noCompany) return false;

  if ((job?.anzsco || "").trim()) return true;
  if (/\bANZSCO\b/i.test(job?.title || "")) return true;
  if (/training/i.test(job?.category || "")) return true;
  if ((job?.type || "").toLowerCase() === "traineeship") return true;

  return false;
}

/** Public label when employer company is hidden (admin-posted training roles). */
export function jobEmployerLabel(job?: {
  companyName?: string;
  isSignetJob?: boolean;
  postedBy?: string;
  hideCompany?: boolean;
  category?: string;
  anzsco?: string;
  type?: string;
  title?: string;
  companyId?: string;
}): string {
  if (isSignetJob(job)) {
    return job?.category?.trim() || "Signet training role";
  }
  const name = job?.companyName?.trim();
  return name || "";
}

/** Whether to show an employer / company row in job UI. */
export function showJobEmployer(job?: Parameters<typeof isSignetJob>[0]): boolean {
  if (isSignetJob(job)) return false;
  return !!(job?.companyName?.trim() || job?.companyId?.trim());
}

type JobSearchFields = {
  title?: string;
  category?: string;
  skills?: string[];
  description?: string;
  companyName?: string;
  location?: string;
};

/** Searchable text blob for a job — shared by browse page and landing counts. */
export function jobSearchHaystack(job: JobSearchFields): string {
  return normalizeSearchText(
    [
      job.title,
      job.category,
      (job.skills || []).join(" "),
      job.description,
      job.companyName,
      job.location,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

/**
 * Match jobs to a free-text query.
 * - Full phrase match wins.
 * - Multi-word queries require every token (2+ chars) to appear — e.g. "UI/UX Designer"
 *   matches jobs with ui + ux + designer, not every "Graphics designer".
 */
export function jobMatchesSearchTerm(job: JobSearchFields, term: string): boolean {
  const q = term.trim();
  if (!q) return true;

  const hay = jobSearchHaystack(job);
  const normalized = normalizeSearchText(q.replace(/\//g, " "));
  if (normalized && hay.includes(normalized)) return true;

  const tokens = normalized.split(" ").filter((t) => t.length >= 2);
  if (tokens.length === 0) return false;
  if (tokens.length === 1) return hay.includes(tokens[0]);
  return tokens.every((t) => hay.includes(t));
}

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
  "Trainee",
  "Remote",
] as const;

export function jobTypesMatch(jobType?: string, filterType?: string): boolean {
  const job = normalizeJobType(jobType);
  const filter = normalizeJobType(filterType);
  if (!job || !filter) return false;
  if (job === filter) return true;
  if (job.includes("trainee") && filter.includes("trainee")) return true;
  return false;
}

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

/** Named section titles. Keep "Supervision" out of the phrase split — it matches inside "under supervision". */
const MULTI_HEADING =
  "Position Purpose|Training and Duties|Training Outcomes|Roles\\s+(?:and|&)\\s+Responsibilities|Key Responsibilities|About the (?:role|job)|Candidate Requirements|What you(?:'|’)ll do|What you will do";

const JOB_SECTION_HEADING = new RegExp(
  `^(?:${MULTI_HEADING}|Supervision|Requirements|Candidate)$`,
  "i"
);

const PROSE_HEADING =
  /^(Position Purpose|Training Outcomes|Supervision|Candidate Requirements|Requirements)$/i;

const HEADING_LABELS: { test: RegExp; label: string }[] = [
  { test: /position purpose/i, label: "Position Purpose" },
  { test: /training and duties/i, label: "Training and Duties" },
  { test: /training outcomes/i, label: "Training Outcomes" },
  { test: /roles\s+(?:and|&)\s+responsibilities/i, label: "Roles and Responsibilities" },
  { test: /key responsibilities/i, label: "Key Responsibilities" },
  { test: /about the role/i, label: "About the Role" },
  { test: /about the job/i, label: "About the Job" },
  { test: /what you(?:'|’)ll do|what you will do/i, label: "What You'll Do" },
  { test: /candidate requirements/i, label: "Candidate Requirements" },
  { test: /^supervision$/i, label: "Supervision" },
  { test: /^candidate$/i, label: "Candidate" },
  { test: /^requirements$/i, label: "Requirements" },
];

export type JobDescriptionSection = {
  heading?: string;
  intro?: string;
  items: string[];
};

function titleCaseHeading(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b([a-z])/g, (letter) => letter.toUpperCase())
    .replace(/\bAnd\b/g, "and");
}

function looksLikeSectionTitle(line: string): boolean {
  const value = line.replace(/[.]+$/, "").trim();
  if (value.length < 3 || value.length > 42) return false;
  if (/[,;]/.test(value) || /:\s*$/.test(value)) return false;
  const words = value.split(/\s+/);
  if (words.length < 2 || words.length > 5) return false;
  return words.every(
    (word) => /^[A-Z]/.test(word) || /^(and|&|the|of|in|for)$/i.test(word)
  );
}

function isLeadInLine(line: string): boolean {
  const value = line.trim();
  if (value.length > 140) return false;
  return (
    /:\s*$/.test(value) ||
    /\b(skills in|including|such as|as follows)\s*:?\s*$/i.test(value)
  );
}

function isIntroLine(line: string, heading?: string): boolean {
  if (isLeadInLine(line)) return true;
  const words = line.trim().split(/\s+/).filter(Boolean).length;
  const complete = /[.!?]\s*$/.test(line);
  const longProse = line.length >= 110 || (complete && words >= 12);
  if (heading && PROSE_HEADING.test(heading)) {
    return longProse || complete || words >= 10;
  }
  return longProse;
}

function isolateSectionHeadings(raw: string): string {
  const afterHeading = "(?:\\s*[.:])?(?=\\s*$|\\n|[•·▪◦]|\\s+[A-Z])";
  const multi = new RegExp(`\\s*(${MULTI_HEADING})${afterHeading}`, "gi");
  const single = new RegExp(
    `(?:^|\\n|[•·▪◦]\\s*|(?<=[.!?]\\s))(Supervision|Candidate|Requirements)${afterHeading}`,
    "gi"
  );
  return raw.replace(multi, "\n$1\n").replace(single, "\n$1\n");
}

export function isJobTextHeading(line?: string): boolean {
  const value = (line || "").replace(/[.]+$/, "").trim();
  if (!value || value.length > 48) return false;
  if (JOB_SECTION_HEADING.test(value)) return true;
  return looksLikeSectionTitle(value);
}

export function isMeaningfulJobPoint(line?: string): boolean {
  return (line || "").replace(/[\s.•·▪◦,;:\-–—*]+/g, "").length >= 2;
}

export function formatJobSectionHeading(line?: string): string {
  const value = (line || "").replace(/[.]+$/, "").trim();
  const match = HEADING_LABELS.find((item) => item.test.test(value));
  return match?.label || titleCaseHeading(value);
}

export function splitJobTextToPoints(text?: string): string[] {
  const raw = (text || "").replace(/\u00a0/g, " ").trim();
  if (!raw) return [];

  const cleanPoint = (line: string) =>
    line
      .replace(/^[\s•·▪◦\-–—*]+/, "")
      .replace(/^\d+[.)]\s*/, "")
      .replace(/^[,.;]+\s*/, "")
      .replace(/^[.\s]+$/, "")
      .trim();

  const prepared = isolateSectionHeadings(raw)
    .replace(/((?:skills in|including|such as|as follows)\s*:)\s*/gi, "$1\n")
    .replace(/\s*[•·▪◦]\s*/g, "\n");

  const byNewline = prepared
    .split(/\r?\n+/)
    .map(cleanPoint)
    .filter((line) => isJobTextHeading(line) || isMeaningfulJobPoint(line));
  if (byNewline.length > 1) return byNewline;

  const byInlineDash = raw
    .split(/\s+-\s+(?=[A-Za-z0-9])/)
    .map(cleanPoint)
    .filter(isMeaningfulJobPoint);
  if (byInlineDash.length > 1) return byInlineDash;

  const bySemicolon = raw
    .split(/\s*;\s+/)
    .map(cleanPoint)
    .filter(isMeaningfulJobPoint);
  if (bySemicolon.length > 1) return bySemicolon;

  const single = cleanPoint(raw);
  return isMeaningfulJobPoint(single) ? [single] : [];
}

export function parseJobDescriptionSections(
  text?: string
): JobDescriptionSection[] {
  const points = splitJobTextToPoints(text);
  const sections: JobDescriptionSection[] = [];
  let current: JobDescriptionSection = { items: [] };

  const flush = () => {
    const intro =
      current.intro && isMeaningfulJobPoint(current.intro)
        ? current.intro
        : undefined;
    const items = current.items.filter(isMeaningfulJobPoint);
    if (!current.heading && !intro && items.length === 0) return;
    if (current.heading && !intro && items.length === 0) return;
    sections.push({ heading: current.heading, intro, items });
  };

  points.forEach((point) => {
    if (isJobTextHeading(point)) {
      if (current.heading && !current.intro && current.items.length === 0) {
        current.heading = formatJobSectionHeading(
          `${current.heading} ${point}`
        );
        return;
      }
      flush();
      current = { heading: formatJobSectionHeading(point), items: [] };
      return;
    }
    if (!current.items.length && isIntroLine(point, current.heading)) {
      current.intro = current.intro ? `${current.intro} ${point}` : point;
      return;
    }
    current.items.push(point);
  });
  flush();
  return sections;
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
