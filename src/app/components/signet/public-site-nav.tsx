"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { buildRegisterUrl } from "@/lib/auth-flow";
import { SIGNET_LOGO as signetLogo, SIGNET_LOGO_ALT } from "@/lib/brand";

type Props = {
  rightExtra?: React.ReactNode;
  variant?: "default" | "browse";
  searchTerm?: string;
};

export default function PublicSiteNav({
  rightExtra,
  variant = "default",
  searchTerm,
}: Props) {
  const { user, profile, loading, homePath, logout } = useAuth();
  const pathname = usePathname();
  const loggedIn = !loading && !!user;
  const isCompany = profile?.userType === "company";

  return (
    <header className={`nk-nav ${variant === "browse" ? "nk-nav-browse" : ""}`}>
      <div className="nk-container nk-nav-inner">
        <div className="nk-nav-left">
          <Link href="/" className="nk-brand">
            <span className="nk-brand-mark">
              <Image
                src={signetLogo}
                alt={SIGNET_LOGO_ALT}
                width={36}
                height={36}
                sizes="36px"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                priority
              />
            </span>
            <span className="nk-brand-wordmark">
              <strong>Signet</strong>
              <em>Employment Hub</em>
            </span>
          </Link>
          <nav className="nk-nav-links" aria-label="Primary">
            <Link href="/" className={pathname === "/" ? "active" : ""}>
              <i className="bi bi-house" /> Home
            </Link>
            <Link href="/jobs" className={pathname.startsWith("/jobs") ? "active" : ""}>
              <i className="bi bi-briefcase" /> Jobs
            </Link>
            <Link href="/companies" className={pathname.startsWith("/companies") ? "active" : ""}>
              <i className="bi bi-building" /> Companies
            </Link>
            <Link
              href="/career-tips"
              className={pathname.startsWith("/career-tips") ? "active" : ""}
            >
              <i className="bi bi-journal-text" /> Career Tips
            </Link>
          </nav>
        </div>

        <div className="nk-nav-right">
          {rightExtra}
          {loggedIn ? (
            <>
              <Link href={homePath} className="nk-btn nk-btn-ghost">
                {isCompany ? "Company dashboard" : "Dashboard"}
              </Link>
              <button
                type="button"
                className="nk-btn nk-btn-register"
                onClick={() => logout()}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href={
                  searchTerm
                    ? `/login?returnUrl=${encodeURIComponent(`/jobs?q=${searchTerm}`)}`
                    : "/login"
                }
                className="nk-btn nk-btn-ghost"
              >
                Login
              </Link>
              <Link
                href={buildRegisterUrl(searchTerm ? `/jobs?q=${searchTerm}` : undefined)}
                className="nk-btn nk-btn-register"
              >
                Create free account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}