"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import signetLogo from "@/assets/images/logo/signet-icon.png";

type Props = {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showTabs?: boolean;
  footer?: React.ReactNode;
};

export default function AuthShell({
  children,
  title,
  subtitle,
  showTabs = true,
  footer,
}: Props) {
  const pathname = usePathname();
  const isLogin = pathname?.startsWith("/login");
  const isRegister = pathname?.startsWith("/register");

  return (
    <div className="signet-auth-wrap">
      <div className="signet-auth-ambient" aria-hidden />

      <Link href="/" className="signet-auth-back">
        <i className="bi bi-arrow-left" />
        <span>Back to site</span>
      </Link>

      <div className="signet-auth-stage">
        <aside className="signet-auth-aside d-none d-lg-flex">
          <div className="signet-auth-aside-inner">
            <div className="signet-brand-mark lg">
              <Image
                src={signetLogo}
                alt="Signet"
                width={64}
                height={64}
                sizes="64px"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                priority
              />
            </div>
            <p className="signet-eyebrow">Signet Employment Hub</p>
            <h2>Work moves faster when hiring feels clear.</h2>
            <p>
              One place for candidates and companies — jobs, applications, and
              chat, synced with the Signet app.
            </p>
            <ul className="signet-auth-points">
              <li>
                <i className="bi bi-lightning-charge" />
                Apply or post in minutes
              </li>
              <li>
                <i className="bi bi-chat-dots" />
                Message recruiters directly
              </li>
              <li>
                <i className="bi bi-shield-check" />
                Secure Firebase-backed accounts
              </li>
            </ul>
          </div>
        </aside>

        <div className="signet-auth-card">
          <div className="signet-auth-card-head">
            <Link href="/" className="signet-brand-mark d-lg-none">
              <Image
                src={signetLogo}
                alt="Signet"
                width={44}
                height={44}
                sizes="44px"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                priority
              />
            </Link>
            <p className="signet-eyebrow">Account</p>
            <h2>{title}</h2>
            {subtitle && <p className="signet-auth-lead">{subtitle}</p>}
          </div>

          {showTabs && (isLogin || isRegister) && (
            <div className="signet-auth-tabs" role="tablist">
              <Link
                href="/login"
                role="tab"
                aria-selected={!!isLogin}
                className={isLogin ? "active" : ""}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                role="tab"
                aria-selected={!!isRegister}
                className={isRegister ? "active" : ""}
              >
                Create account
              </Link>
              <span
                className="signet-auth-tabs-ink"
                style={{ transform: isRegister ? "translateX(100%)" : "translateX(0)" }}
                aria-hidden
              />
            </div>
          )}

          {children}

          {footer && <div className="signet-auth-footer">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

export function AuthRoleTabs({
  value,
  onChange,
}: {
  value: "candidate" | "company";
  onChange: (v: "candidate" | "company") => void;
}) {
  return (
    <div className="signet-role-tabs" role="tablist" aria-label="Account type">
      <button
        type="button"
        role="tab"
        aria-selected={value === "candidate"}
        className={value === "candidate" ? "active" : ""}
        onClick={() => onChange("candidate")}
      >
        <i className="bi bi-person" />
        <span>
          <strong>Candidate</strong>
          <em>Find roles</em>
        </span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === "company"}
        className={value === "company" ? "active" : ""}
        onClick={() => onChange("company")}
      >
        <i className="bi bi-buildings" />
        <span>
          <strong>Company</strong>
          <em>Hire talent</em>
        </span>
      </button>
    </div>
  );
}
