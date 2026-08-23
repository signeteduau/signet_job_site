export function normalizeArticleImage(url?: string): string {
  const raw = (url || "").trim();
  if (!raw) return "";

  if (raw.includes("images.unsplash.com")) {
    const base = raw.split("?")[0];
    return `${base}?auto=format&fit=crop&w=1200&h=675&q=80`;
  }

  return raw;
}

export function estimateReadMinutes(content?: string): number {
  const words = (content || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function formatArticleDate(value: unknown): string {
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
    return date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function articleMatchesQuery(
  article: {
    title?: string;
    subtitle?: string;
    author?: string;
    tags?: string[];
    content?: string;
  },
  term: string
): boolean {
  const q = term.trim().toLowerCase();
  if (!q) return true;
  const hay = [
    article.title,
    article.subtitle,
    article.author,
    (article.tags || []).join(" "),
    article.content,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}
