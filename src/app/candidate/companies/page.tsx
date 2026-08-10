"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import AuthGate from "@/app/components/signet/auth-gate";
import AppShell from "@/app/components/signet/app-shell";
import { ChatListShimmer } from "@/app/components/signet/shimmer";
import { fetchCompanies } from "@/lib/services/jobs";
import Wrapper from "@/layouts/wrapper";

type CompanyRow = {
  uid: string;
  companyName?: string;
  fullName?: string;
  logoUrl?: string;
  profileImage?: string;
  industry?: string;
  companyLocation?: string;
  address?: string;
};

function CompaniesInner() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = (await fetchCompanies(50)) as CompanyRow[];
        setCompanies(list);
      } catch {
        toast.error("Could not load companies.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = companies.filter((c) => {
    const name = (c.companyName || c.fullName || "").toLowerCase();
    const q = term.trim().toLowerCase();
    if (!q) return true;
    return (
      name.includes(q) ||
      (c.industry || "").toLowerCase().includes(q) ||
      (c.companyLocation || c.address || "").toLowerCase().includes(q)
    );
  });

  return (
    <AppShell role="candidate" title="Companies">
      <form
        className="signet-search-row"
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          placeholder="Search companies…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </form>

      {loading && <ChatListShimmer count={6} />}
      {!loading && filtered.length === 0 && (
        <div className="signet-empty">
          <h4>No companies found</h4>
          <p>Try a different search.</p>
        </div>
      )}

      {filtered.map((c) => {
        const name = c.companyName || c.fullName || "Company";
        return (
          <Link
            key={c.uid}
            href={`/candidate/companies/${c.uid}`}
            className="signet-panel d-flex align-items-center gap-3 text-decoration-none"
          >
            <div className="signet-logo-tile">
              {c.logoUrl || c.profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.logoUrl || c.profileImage} alt={name} />
              ) : (
                <span>{name.charAt(0)}</span>
              )}
            </div>
            <div>
              <div className="signet-job-title">{name}</div>
              <div style={{ color: "#6B7280", fontSize: 13 }}>
                {[c.industry, c.companyLocation || c.address]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </div>
          </Link>
        );
      })}
    </AppShell>
  );
}

export default function CompaniesPage() {
  return (
    <Wrapper>
      <AuthGate role="candidate">
        <CompaniesInner />
      </AuthGate>
    </Wrapper>
  );
}
