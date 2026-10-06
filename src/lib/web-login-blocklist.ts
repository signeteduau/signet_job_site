export const ADMIN_LOGIN_URL = "https://admin.signetemploymenthub.com/login";

export const WEB_LOGIN_BLOCKED_EMAILS = [
  "pushpinder@signet.edu.au",
  "mac@signet.edu.au",
  "justin.f@signet.edu.au",
  "salesmanager@signet.edu.au",
  "christine.w@signet.edu.au",
  "navdeep.k@signet.edu.au",
  "mai.n@signet.edu.au",
] as const;

const WEB_LOGIN_BLOCKED = new Set<string>(WEB_LOGIN_BLOCKED_EMAILS);

export function normalizeEmail(email?: string | null): string {
  return (email || "").trim().toLowerCase();
}

export function isWebLoginBlocked(email?: string | null): boolean {
  return WEB_LOGIN_BLOCKED.has(normalizeEmail(email));
}

export class WebLoginBlockedError extends Error {
  readonly adminUrl = ADMIN_LOGIN_URL;

  constructor() {
    super(`This account is for Signet admin. Sign in at ${ADMIN_LOGIN_URL}`);
    this.name = "WebLoginBlockedError";
  }
}

export function assertWebLoginAllowed(email?: string | null): void {
  if (isWebLoginBlocked(email)) {
    throw new WebLoginBlockedError();
  }
}
