export function normalizeArticleImage(url?: string): string {
  const raw = (url || "").trim();
  if (!raw) return "";

  if (raw.includes("images.unsplash.com")) {
    const base = raw.split("?")[0];
    return `${base}?auto=format&fit=crop&w=1200&h=675&q=80`;
  }

  return raw;
}

function decodeHtmlEntities(text: string): string {
  if (!text) return "";
  if (typeof document !== "undefined") {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    return textarea.value;
  }
  return text
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, "&");
}

function normalizeArticleContent(raw?: string): string {
  let text = (raw || "").trim();
  if (!text) return "";

  // Admin/CMS often stores escaped HTML entities.
  if (/&lt;\/?[a-z]/i.test(text) && !/<\/?[a-z]/i.test(text)) {
    text = decodeHtmlEntities(text);
  }

  return text;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Strip tags for word counts and search snippets. */
export function stripHtml(html?: string): string {
  return (html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

const ARTICLE_ALLOWED_TAGS = new Set([
  "P",
  "BR",
  "STRONG",
  "B",
  "EM",
  "I",
  "U",
  "S",
  "STRIKE",
  "H1",
  "H2",
  "H3",
  "H4",
  "UL",
  "OL",
  "LI",
  "A",
  "BLOCKQUOTE",
  "PRE",
  "CODE",
  "IMG",
  "SPAN",
  "DIV",
]);

const ARTICLE_ALLOWED_ATTRS: Record<string, Set<string>> = {
  A: new Set(["href", "target", "rel", "title"]),
  IMG: new Set(["src", "alt", "title"]),
  P: new Set(["class"]),
  SPAN: new Set(["class", "style"]),
  DIV: new Set(["class"]),
  BLOCKQUOTE: new Set(["class"]),
  PRE: new Set(["class"]),
  CODE: new Set(["class"]),
};

function sanitizeUrl(value: string, allowMailto = false): string | null {
  const url = value.trim();
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (allowMailto && /^mailto:/i.test(url)) return url;
  return null;
}

function sanitizeNode(node: Node): Node | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.cloneNode(false);
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const el = node as HTMLElement;
  const tag = el.tagName.toUpperCase();

  if (!ARTICLE_ALLOWED_TAGS.has(tag)) {
    const fragment = document.createDocumentFragment();
    Array.from(el.childNodes).forEach((child) => {
      const safe = sanitizeNode(child);
      if (safe) fragment.appendChild(safe);
    });
    return fragment.childNodes.length ? fragment : null;
  }

  const clean = document.createElement(tag.toLowerCase());
  const allowedAttrs = ARTICLE_ALLOWED_ATTRS[tag] || new Set<string>();

  allowedAttrs.forEach((attr) => {
    const value = el.getAttribute(attr);
    if (!value) return;

    if (attr === "href") {
      const safe = sanitizeUrl(value, true);
      if (safe) {
        clean.setAttribute("href", safe);
        if (safe.startsWith("http")) {
          clean.setAttribute("target", "_blank");
          clean.setAttribute("rel", "noopener noreferrer");
        }
      }
      return;
    }

    if (attr === "src") {
      const safe = sanitizeUrl(value);
      if (safe) clean.setAttribute("src", safe);
      return;
    }

    if (attr === "style") {
      const safeStyle = value.replace(/expression\s*\(/gi, "").replace(/javascript:/gi, "");
      if (safeStyle.trim()) clean.setAttribute("style", safeStyle);
      return;
    }

    clean.setAttribute(attr, value);
  });

  Array.from(el.childNodes).forEach((child) => {
    const safe = sanitizeNode(child);
    if (!safe) return;
    if (safe.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      Array.from(safe.childNodes).forEach((n) => clean.appendChild(n));
    } else {
      clean.appendChild(safe);
    }
  });

  return clean;
}

/** Render admin-authored HTML safely on the public article page. */
export function sanitizeArticleHtml(html?: string): string {
  const raw = normalizeArticleContent(html);
  if (!raw) return "";

  // Legacy plain-text articles saved before the rich editor.
  if (!/<[a-z][\s\S]*>/i.test(raw)) {
    return raw
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
      .join("");
  }

  if (typeof document === "undefined") {
    return raw;
  }

  const doc = new DOMParser().parseFromString(raw, "text/html");
  const container = document.createElement("div");

  Array.from(doc.body.childNodes).forEach((node) => {
    const safe = sanitizeNode(node);
    if (!safe) return;
    if (safe.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      Array.from(safe.childNodes).forEach((n) => container.appendChild(n));
    } else {
      container.appendChild(safe);
    }
  });

  return container.innerHTML.trim();
}

export function estimateReadMinutes(content?: string): number {
  const words = stripHtml(content).split(/\s+/).filter(Boolean).length;
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
    stripHtml(article.content),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}
