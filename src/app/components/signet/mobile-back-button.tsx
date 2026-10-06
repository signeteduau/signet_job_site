"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";

type Props = {
  fallback?: string;
  className?: string;
};

export function resolveMobileBackFallback(
  pathname: string | null,
  role?: "candidate" | "company"
): string {
  const path = pathname || "/";
  if (path.startsWith("/jobs/") && path !== "/jobs") return "/jobs";
  if (path.startsWith("/career-tips/")) return "/career-tips";
  if (path.startsWith("/companies/") && path !== "/companies") return "/companies";
  if (path.startsWith("/candidate/companies/")) return "/candidate/companies";
  if (path === "/company/jobs/new" || path.startsWith("/company/jobs/")) {
    return "/company/jobs";
  }
  if (path.startsWith("/company/applications/")) return "/company/applications";
  if (/\/jobs\/[^/]+\/apply$/.test(path)) {
    const id = path.split("/")[3];
    return id ? `/jobs/${id}` : "/jobs";
  }
  if (role === "company") return "/company";
  if (role === "candidate") return "/candidate";
  return "/";
}

export default function MobileBackButton({ fallback, className = "" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const dest = fallback || resolveMobileBackFallback(pathname);

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(dest);
  };

  return (
    <button
      type="button"
      className={`signet-mobile-back ${className}`.trim()}
      onClick={goBack}
      aria-label="Go back"
    >
      <i className="bi bi-arrow-left" aria-hidden />
    </button>
  );
}
