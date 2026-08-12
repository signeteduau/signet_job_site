"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { SIGNET_LOGO as signetLogo, SIGNET_LOGO_ALT } from "@/lib/brand";
import ProfileAvatar from "@/app/components/signet/profile-avatar";
import { useAuth } from "@/context/auth-context";
import { subscribeToChats } from "@/lib/services/chat";
import { subscribeToNotifications } from "@/lib/services/notifications";

type NavItem = { href: string; label: string; icon: string; badge?: number };

const candidateNavBase: Omit<NavItem, "badge">[] = [
  { href: "/candidate", label: "Home", icon: "bi-house" },
  { href: "/jobs", label: "Jobs", icon: "bi-briefcase" },
  { href: "/candidate/chat", label: "Chat", icon: "bi-chat-dots" },
  { href: "/candidate/my-jobs", label: "My Jobs", icon: "bi-bookmark" },
  { href: "/candidate/profile", label: "Profile", icon: "bi-person" },
];

const companyNavBase: Omit<NavItem, "badge">[] = [
  { href: "/company", label: "Home", icon: "bi-house" },
  { href: "/company/applications", label: "Inbox", icon: "bi-people" },
  { href: "/company/chat", label: "Chat", icon: "bi-chat-dots" },
  { href: "/company/jobs", label: "Posted", icon: "bi-briefcase" },
  { href: "/company/profile", label: "Profile", icon: "bi-person" },
];

export default function AppShell({
  children,
  role,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  role: "candidate" | "company";
  title?: string;
  subtitle?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, logout, user } = useAuth();
  const [notifCount, setNotifCount] = useState(0);
  const [chatCount, setChatCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const unsubN = subscribeToNotifications(user.uid, (items) => {
      setNotifCount(items.filter((n) => !n.read).length);
    });
    const unsubC = subscribeToChats(user.uid, (chats) => {
      const unread = chats.filter((c) =>
        role === "company" ? c.unreadByCompany : c.unreadByCandidate
      ).length;
      setChatCount(unread);
    });
    return () => {
      unsubN();
      unsubC();
    };
  }, [user, role]);

  const nav: NavItem[] = (role === "company" ? companyNavBase : candidateNavBase).map(
    (item) =>
      item.href.endsWith("/chat")
        ? { ...item, badge: chatCount }
        : { ...item }
  );

  return (
    <div className="signet-app">
      <div className="signet-ambient" aria-hidden />
      <header className="signet-topbar">
        <div className="signet-app-layout">
          <div className="signet-topbar-main d-flex align-items-center justify-content-between">
          <Link
            href={role === "company" ? "/company" : "/candidate"}
            className="signet-brand-link"
          >
            <span className="signet-brand-mark">
              <Image
                src={signetLogo}
                alt={SIGNET_LOGO_ALT}
                width={44}
                height={44}
                sizes="44px"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                priority
              />
            </span>
            <span className="d-none d-sm-flex flex-column">
              <span className="signet-brand">SIGNET</span>
              <span className="signet-sub">Employment Hub</span>
            </span>
          </Link>
          <div className="d-flex align-items-center gap-2 gap-sm-3">
            <Link
              href={
                role === "company"
                  ? "/company/notifications"
                  : "/candidate/notifications"
              }
              className="signet-icon-pill"
              title="Notifications"
              aria-label={`Notifications${notifCount ? `, ${notifCount} unread` : ""}`}
            >
              <i className="bi bi-bell" />
              {notifCount > 0 && (
                <span className="signet-badge">{notifCount > 9 ? "9+" : notifCount}</span>
              )}
            </Link>
            {role === "candidate" && (
              <Link
                href="/candidate/articles"
                className="signet-icon-pill d-none d-md-inline-flex"
                title="Articles"
              >
                <i className="bi bi-journal-text" />
              </Link>
            )}
            <Link
              href={
                role === "company" ? "/company/profile" : "/candidate/profile"
              }
              className="signet-user-chip"
              title="Profile"
            >
              <ProfileAvatar
                src={profile?.logoUrl || profile?.profileImage}
                name={profile?.companyName || profile?.fullName || "U"}
                size="md"
                rounded={role === "company" ? "tile" : "circle"}
              />
              <span className="d-none d-md-inline text-truncate">
                {profile?.fullName || profile?.companyName || user?.email}
              </span>
            </Link>
            <button
              className="signet-ghost-btn"
              onClick={async () => {
                await logout();
                router.push("/login");
              }}
            >
              Logout
            </button>
          </div>
          </div>
        </div>
      </header>

      <div className="signet-app-layout signet-body">
        <aside className="signet-sidebar">
          <nav>
            <div className="signet-nav-label">Navigate</div>
            {nav.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== `/${role}` && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`signet-nav-link ${active ? "active" : ""}`}
                >
                  <i className={`bi ${item.icon}`} />
                  <span>{item.label}</span>
                  {!!item.badge && item.badge > 0 && (
                    <span className="signet-nav-count">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                  {active && <span className="signet-nav-bar" />}
                </Link>
              );
            })}
            {role === "company" && (
              <Link href="/company/jobs/new" className="signet-cta-nav">
                <i className="bi bi-plus-lg" /> Post Job
              </Link>
            )}
          </nav>
        </aside>

        <main className="signet-main">
          {title && (
            <header className="signet-page-head">
              <div>
                <p className="signet-eyebrow">
                  {role === "company" ? "Employer workspace" : "Candidate hub"}
                </p>
                <h1 className="signet-page-title">{title}</h1>
                {subtitle && <p className="signet-page-sub">{subtitle}</p>}
              </div>
            </header>
          )}
          {children}
        </main>
      </div>

      <nav className="signet-bottom-nav d-lg-none">
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== `/${role}` && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? "active" : ""}
            >
              <span className="icon-wrap">
                <i className={`bi ${item.icon}`} />
                {!!item.badge && item.badge > 0 && (
                  <span className="signet-badge sm">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
