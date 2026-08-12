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
  const { user, profile, loading, homePath } = useAuth();
  const pathname = usePathname();
  const loggedIn = !loading && user && profile?.profileCompleted;

  return (
    <header className={`signet-site-nav ${variant === "browse" ? "nk-nav-browse" : ""}`}>
      <div className="container nk-nav-inner">
        <Link href="/" className="signet-brand-link">
          <span className="signet-brand-mark">
            <Image
              src={signetLogo}
              alt={SIGNET_LOGO_ALT}
              width={44}
              height={44}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </span>
          <span className="d-none d-sm-flex flex-column">
            <span className="signet-brand">SIGNET</span>
            <span className="signet-sub">Employment Hub</span>
          </span>
        </Link>

        {variant === "browse" && (
          <nav className="nk-nav-links d-none d-lg-flex" aria-label="Main">
            <Link href="/jobs" className={pathname.startsWith("/jobs") ? "active" : ""}>
              Jobs
            </Link>
            <Link
              href="/companies"
              className={pathname.startsWith("/companies") ? "active" : ""}
            >
              Companies
            </Link>
            {!loggedIn && <Link href="/">Services</Link>}
          </nav>
        )}

        <div className="nk-nav-actions">
          {rightExtra}
          {loggedIn ? (
            <>
              <Link href={homePath} className="signet-ghost-btn">
                Dashboard
              </Link>
              <Link href="/jobs" className="signet-btn signet-btn-sm">
                Browse jobs
              </Link>
            </>
          ) : (
            <>
              <Link
                href={
                  searchTerm
                    ? `/login?returnUrl=${encodeURIComponent(`/jobs?q=${searchTerm}`)}`
                    : "/login"
                }
                className="signet-ghost-btn"
              >
                Login
              </Link>
              <Link
                href={buildRegisterUrl(searchTerm ? `/jobs?q=${searchTerm}` : undefined)}
                className="signet-btn signet-btn-sm nk-nav-register"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
