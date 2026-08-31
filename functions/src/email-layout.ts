const BRAND = {
  blue: "#2550eb",
  blueDark: "#1a3fb8",
  ink: "#121824",
  muted: "#5b6475",
  soft: "#f4f6fb",
  border: "#e7eaf3",
  accent: "#ff7555",
};

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export type EmailLayoutOpts = {
  preheader?: string;
  badge?: string;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  appUrl?: string;
};

export function renderEmailLayout(opts: EmailLayoutOpts): {
  html: string;
  text: string;
} {
  const preheader = opts.preheader || opts.title;
  const badge = opts.badge || "Signet Employment Hub";
  const appUrl = opts.appUrl || "https://signetemploymenthub.com";

  const ctaHtml =
    opts.ctaLabel && opts.ctaUrl
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
          <tr>
            <td style="border-radius:999px;background:linear-gradient(135deg,${BRAND.blue},${BRAND.blueDark});">
              <a href="${opts.ctaUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:999px;">
                ${escapeHtml(opts.ctaLabel)}
              </a>
            </td>
          </tr>
        </table>`
      : "";

  const ctaText =
    opts.ctaLabel && opts.ctaUrl
      ? `\n\n${opts.ctaLabel}: ${opts.ctaUrl}`
      : "";

  const bodyHtml = opts.body.trim();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.soft};font-family:Arial,Helvetica,sans-serif;color:${BRAND.ink};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.soft};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
          <tr>
            <td style="padding:0 0 18px;text-align:center;">
              <a href="${appUrl}" style="text-decoration:none;">
                <span style="display:inline-block;width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,${BRAND.blue},${BRAND.blueDark});color:#fff;font-size:22px;font-weight:800;line-height:44px;text-align:center;">S</span>
              </a>
            </td>
          </tr>
          <tr>
            <td style="border-radius:24px;overflow:hidden;background:#ffffff;border:1px solid ${BRAND.border};box-shadow:0 18px 40px rgba(18,24,36,0.08);">
              <div style="height:6px;background:linear-gradient(90deg,${BRAND.blue},${BRAND.accent});"></div>
              <div style="padding:32px 28px 30px;">
                <p style="margin:0 0 10px;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${BRAND.blue};">${escapeHtml(badge)}</p>
                <h1 style="margin:0 0 18px;font-size:26px;line-height:1.25;font-weight:800;color:${BRAND.ink};">${escapeHtml(opts.title)}</h1>
                <div style="font-size:15px;line-height:1.75;color:${BRAND.muted};">${bodyHtml}</div>
                ${ctaHtml}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 8px 0;text-align:center;font-size:12px;line-height:1.6;color:#8b93a7;">
              <p style="margin:0 0 6px;">Signet Employment Hub · <a href="${appUrl}" style="color:${BRAND.blue};text-decoration:none;">signetemploymenthub.com</a></p>
              <p style="margin:0;">Need help? Reply to this email or contact <a href="mailto:signeteduau@gmail.com" style="color:${BRAND.blue};text-decoration:none;">signeteduau@gmail.com</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `${opts.title}\n\n${stripHtml(bodyHtml)}${ctaText}\n\nSignet Employment Hub\n${appUrl}`;

  return { html, text };
}

export function infoBox(content: string): string {
  return `<div style="margin:18px 0;padding:16px 18px;border-radius:16px;background:${BRAND.soft};border:1px solid ${BRAND.border};color:${BRAND.ink};font-size:15px;line-height:1.6;">${content}</div>`;
}

export function bulletList(items: string[]): string {
  return `<ul style="margin:12px 0 0;padding-left:20px;line-height:1.8;color:${BRAND.muted};">${items
    .map((item) => `<li style="margin-bottom:6px;">${item}</li>`)
    .join("")}</ul>`;
}
