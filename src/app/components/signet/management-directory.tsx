"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { ShimmerBlock } from "@/app/components/signet/shimmer";
import { formatAppliedDate } from "@/lib/job-utils";
import { formatFullPhone } from "@/lib/phone-country-codes";
import { fetchUsersByType } from "@/lib/services/users";
import { isManagementEmail } from "@/lib/management";
import { AppUser } from "@/types/firestore";

type DirectoryKind = "employers" | "candidates";

function displayName(user: AppUser, kind: DirectoryKind) {
  if (kind === "employers") {
    return user.companyName || user.fullName || "Company";
  }
  return user.fullName || user.email || "Candidate";
}

function photoUrl(user: AppUser) {
  return user.logoUrl || user.profileImage || "";
}

function matchesQuery(user: AppUser, kind: DirectoryKind, raw: string) {
  const q = raw.trim().toLowerCase();
  if (!q) return true;
  const hay = [
    displayName(user, kind),
    user.fullName,
    user.email,
    user.occupation,
    user.industry,
    user.companyLocation,
    user.address,
    user.city,
    user.state,
    user.phone,
    user.website,
    user.usid,
    (user.skills || []).join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

function sortUsers(users: AppUser[], kind: DirectoryKind) {
  return [...users].sort((a, b) =>
    displayName(a, kind).localeCompare(displayName(b, kind), undefined, {
      sensitivity: "base",
    })
  );
}

function PeopleShimmer({ count = 6 }: { count?: number }) {
  return (
    <div className="signet-people-list" aria-busy="true" aria-label="Loading people">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="signet-people-card is-skeleton">
          <ShimmerBlock className="sk-logo" style={{ width: 52, height: 52, borderRadius: 16 }} />
          <div className="flex-grow-1">
            <ShimmerBlock className="sk-line sk-w-40" style={{ height: 16 }} />
            <ShimmerBlock className="sk-line sk-w-70 mt-2" />
            <ShimmerBlock className="sk-chip mt-2" style={{ width: 88, height: 22 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ManagementDirectory() {
  const [tab, setTab] = useState<DirectoryKind>("employers");
  const [term, setTerm] = useState("");
  const [employers, setEmployers] = useState<AppUser[]>([]);
  const [candidates, setCandidates] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [companyRows, candidateRows] = await Promise.all([
          fetchUsersByType("company"),
          fetchUsersByType("candidate"),
        ]);
        if (!alive) return;
        setEmployers(
          sortUsers(
            companyRows.filter((user) => !isManagementEmail(user.email)),
            "employers"
          )
        );
        setCandidates(
          sortUsers(
            candidateRows.filter((user) => !isManagementEmail(user.email)),
            "candidates"
          )
        );
      } catch {
        toast.error("Could not load people.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const list = tab === "employers" ? employers : candidates;
  const filtered = useMemo(
    () => list.filter((user) => matchesQuery(user, tab, term)),
    [list, tab, term]
  );

  return (
    <div className="signet-people">
      <header className="signet-people-head">
        <p className="signet-eyebrow">Directory</p>
        <h1>People</h1>
        <p>Review every employer and candidate on Signet.</p>
      </header>

      <div className="signet-people-toolbar">
        <div className="signet-people-switch" role="tablist" aria-label="People lists">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "employers"}
            className={`signet-people-tab${tab === "employers" ? " is-active" : ""}`}
            onClick={() => setTab("employers")}
          >
            <span className="signet-people-tab-icon" aria-hidden>
              <i className="bi bi-building" />
            </span>
            <span className="signet-people-tab-copy">
              <strong>Employers</strong>
              <em>{loading ? "Loading" : `${employers.length} companies`}</em>
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "candidates"}
            className={`signet-people-tab${tab === "candidates" ? " is-active" : ""}`}
            onClick={() => setTab("candidates")}
          >
            <span className="signet-people-tab-icon" aria-hidden>
              <i className="bi bi-people" />
            </span>
            <span className="signet-people-tab-copy">
              <strong>Candidates</strong>
              <em>{loading ? "Loading" : `${candidates.length} people`}</em>
            </span>
          </button>
        </div>

        <label className="signet-people-search">
          <i className="bi bi-search" aria-hidden />
          <input
            placeholder={
              tab === "employers" ? "Search employers…" : "Search candidates…"
            }
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            aria-label={tab === "employers" ? "Search employers" : "Search candidates"}
          />
        </label>
      </div>

      {loading && <PeopleShimmer />}

      {!loading && filtered.length === 0 && (
        <div className="signet-people-empty">
          <span className="signet-people-empty-icon" aria-hidden>
            <i className="bi bi-person-lines-fill" />
          </span>
          <h4>No {tab} found</h4>
          <p>{term.trim() ? "Try a different search." : "No profiles in this list yet."}</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="signet-people-list">
          {filtered.map((user) => {
            const name = displayName(user, tab);
            const photo = photoUrl(user);
            const href =
              tab === "employers"
                ? `/management/employers/${user.uid}`
                : `/management/candidates/${user.uid}`;
            const phone = formatFullPhone(user.phoneCountryCode, user.phone);
            const location =
              user.companyLocation ||
              user.address ||
              [user.city, user.state].filter(Boolean).join(", ");
            const chips = (
              tab === "employers"
                ? [user.industry, location]
                : [user.occupation, location, user.isStudent ? "Student" : ""]
            ).filter(Boolean);
            const joined = formatAppliedDate(user.createdAt);

            return (
              <Link key={user.uid} href={href} className="signet-people-card">
                <div
                  className={`signet-people-avatar${
                    tab === "candidates" ? " is-round" : ""
                  }`}
                >
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt="" />
                  ) : (
                    <span>{name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="signet-people-card-body">
                  <div className="signet-people-card-top">
                    <strong>{name}</strong>
                    {joined && <time>{joined}</time>}
                  </div>
                  {tab === "employers" &&
                    user.fullName &&
                    user.fullName !== name && (
                      <p className="signet-people-contact-name">{user.fullName}</p>
                    )}
                  {chips.length > 0 && (
                    <div className="signet-people-chips">
                      {chips.map((chip) => (
                        <span key={chip}>{chip}</span>
                      ))}
                    </div>
                  )}
                  <p className="signet-people-mail">
                    {user.email || "No email"}
                    {phone ? ` · ${phone}` : ""}
                  </p>
                </div>
                <i className="bi bi-chevron-right signet-people-chevron" aria-hidden />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
