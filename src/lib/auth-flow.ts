import { User } from "firebase/auth";
import { AppUser } from "@/types/firestore";

/** Allow only same-origin relative paths (no open redirects). */
export function sanitizeReturnUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw.trim());
    if (!decoded.startsWith("/") || decoded.startsWith("//")) return null;
    if (
      decoded.startsWith("/login") ||
      decoded.startsWith("/register") ||
      decoded.startsWith("/verify-email")
    ) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function buildLoginUrl(returnUrl?: string | null): string {
  const safe = sanitizeReturnUrl(returnUrl ?? null);
  return safe ? `/login?returnUrl=${encodeURIComponent(safe)}` : "/login";
}

export function buildRegisterUrl(returnUrl?: string | null): string {
  const safe = sanitizeReturnUrl(returnUrl ?? null);
  return safe ? `/register?returnUrl=${encodeURIComponent(safe)}` : "/register";
}

export function withReturnUrl(path: string, returnUrl?: string | null): string {
  const safe = sanitizeReturnUrl(returnUrl ?? null);
  if (!safe) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}returnUrl=${encodeURIComponent(safe)}`;
}

export function resolvePostLoginPath(
  profile: AppUser | null,
  user: User | null,
  returnUrl?: string | null
): string {
  if (!user) return buildLoginUrl(returnUrl);

  const safe = sanitizeReturnUrl(returnUrl ?? null);

  if (!user.emailVerified) {
    return withReturnUrl("/verify-email", safe);
  }
  if (!profile) {
    return withReturnUrl("/role-select", safe);
  }
  if (!profile.profileCompleted) {
    return withReturnUrl("/profile-setup", safe);
  }
  if (safe) return safe;
  return profile.userType === "company" ? "/company" : "/candidate";
}

export function isCandidateActionReady(
  profile: AppUser | null,
  user: User | null
): boolean {
  return (
    !!user &&
    user.emailVerified &&
    !!profile &&
    profile.profileCompleted &&
    profile.userType === "candidate"
  );
}

export function applyUrl(jobId: string): string {
  return `/candidate/jobs/${jobId}/apply`;
}
