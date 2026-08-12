"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import CompanyFiltersSidebar, {
  CompanyFilters,
} from "@/app/components/signet/company-filters-sidebar";
import PublicSiteNav from "@/app/components/signet/public-site-nav";
import { PageLoader } from "@/app/components/signet/shimmer";
import { fetchCompanies, fetchJobs } from "@/lib/services/jobs";
import { Job } from "@/types/firestore";
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

function companyName(c: CompanyRow) {
  return c.companyName || c.fullName || "Company";
}

function companyLogo(c: CompanyRow) {
  return c.logoUrl || c.profileImage || "";
}

function companyLocation(c: CompanyRow) {
  return c.companyLocation || c.address || "";
}

function PublicCompaniesInner() {
  const search = useSearchParams();
  const initialQ = search?.get("q") || "";
  const [filters, setFilters] = useState<CompanyFilters>({
    term: initialQ,
    industry: "",
    location: "",
    hiringOnly: false,
  });
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setFilters((f) => ({ ...f, term: initialQ }));
  }, [initialQ]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [companyList, jobList] = await Promise.all([
          fetchCompanies(50),
          fetchJobs(100),
        ]);
        if (!alive) return;
        setCompanies(companyList as CompanyRow[]);
        setJobs(jobList);
      } catch {
        if (alive) {
          setCompanies([]);
          setJobs([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const jobsByCompany = useMemo(() => {
    const map: Record<string, number> = {};
    jobs.forEach((j) => {
      if (j.companyId) {
        map[j.companyId] = (map[j.companyId] || 0) + 1;
      }
      const nameKey = j.companyName?.toLowerCase();
      if (nameKey) {
        map[nameKey] = (map[nameKey] || 0) + 1;
      }
    });
    return map;
  }, [jobs]);

  const openRolesFor = (c: CompanyRow) => {
    const name = companyName(c);
    return (
      jobsByCompany[c.uid] ||
      jobs.filter(
        (j) =>
          j.companyId === c.uid ||
          j.companyName?.toLowerCase() === name.toLowerCase()
      ).length
    );
  };

  const industries = useMemo(() => {
    const set = new Set<string>();
    companies.forEach((c) => {
      if (c.industry?.trim()) set.add(c.industry.trim());
    });
    return Array.from(set).sort();
  }, [companies]);

  const locations = useMemo(() => {
    const set = new Set<string>();
    companies.forEach((c) => {
      const loc = companyLocation(c);
      const city = loc.split(",")[0]?.trim();
      if (city) set.add(city);
    });
    return Array.from(set).sort();
  }, [companies]);

  const filtered = useMemo(() => {
    const q = filters.term.trim().toLowerCase();
    const locQ = filters.location.trim().toLowerCase();

    return companies.filter((c) => {
      const name = companyName(c).toLowerCase();
      const industry = (c.industry || "").toLowerCase();
      const loc = companyLocation(c).toLowerCase();
      const roles = openRolesFor(c);

      if (q && !name.includes(q) && !industry.includes(q) && !loc.includes(q)) {
        return false;
      }
      if (filters.industry && c.industry !== filters.industry) {
        return false;
      }
      if (locQ && !loc.includes(locQ)) {
        return false;
      }
      if (filters.hiringOnly && roles === 0) {
        return false;
      }
      return true;
    });
  }, [companies, filters, jobs, jobsByCompany]);

  const updateFilters = (patch: Partial<CompanyFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
  };

  const clearFilters = () => {
    setFilters((f) => ({
      term: f.term,
      industry: "",
      location: "",
      hiringOnly: false,
    }));
  };

  return (
    <Wrapper>
      <div className="signet-site nk-browse-page">
        <div className="signet-ambient" aria-hidden />
        <PublicSiteNav variant="browse" searchTerm={filters.term} />

        <main className="container nk-browse-layout nk-companies-layout">
          <CompanyFiltersSidebar
            filters={filters}
            industries={industries}
            locations={locations}
            onChange={updateFilters}
            onClear={clearFilters}
          />

          <div className="nk-browse-main nk-companies-main">
            <div className="nk-browse-results-head nk-companies-head">
              <div>
                <h1>
                  {filters.term
                    ? `Companies matching "${filters.term}"`
                    : "Browse companies"}
                </h1>
                <p>
                  {loading
                    ? "Loading companies…"
                    : `${filtered.length} companies hiring on Signet`}
                </p>
              </div>
            </div>

            <form
              className="nk-companies-search"
              onSubmit={(e) => e.preventDefault()}
            >
              <i className="bi bi-search" aria-hidden />
              <input
                value={filters.term}
                onChange={(e) => updateFilters({ term: e.target.value })}
                placeholder="Search by company name, industry, or location"
                aria-label="Search companies"
              />
            </form>

            {loading && (
              <div className="nk-companies-grid">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="nk-company-card is-skeleton" aria-hidden>
                    <span className="nk-shimmer nk-shimmer-logo" />
                    <span className="nk-shimmer nk-shimmer-line" />
                    <span className="nk-shimmer nk-shimmer-line short" />
                  </div>
                ))}
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div className="signet-empty nk-browse-empty">
                <h4>No companies found</h4>
                <p>Try adjusting the filters on the left.</p>
              </div>
            )}

            {!loading && filtered.length > 0 && (
              <div className="nk-companies-grid">
                {filtered.map((c) => {
                  const name = companyName(c);
                  const logo = companyLogo(c);
                  const openRoles = openRolesFor(c);

                  return (
                    <Link
                      key={c.uid}
                      href={`/jobs?q=${encodeURIComponent(name)}`}
                      className="nk-company-card"
                    >
                      <span className="nk-company-logo">
                        {logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={logo} alt="" />
                        ) : (
                          name.slice(0, 1).toUpperCase()
                        )}
                      </span>
                      <strong>{name}</strong>
                      <span className="nk-company-rating">
                        <i className="bi bi-star-fill" />
                        4.{(c.uid.charCodeAt(0) % 5) + 1}
                        <em>
                          {openRoles > 0
                            ? `${openRoles} open roles`
                            : "View open jobs"}
                        </em>
                      </span>
                      <p className="nk-company-tagline">
                        {c.industry ||
                          companyLocation(c) ||
                          "Explore roles from this employer"}
                      </p>
                      <span className="nk-company-cta">
                        View jobs <i className="bi bi-chevron-right" />
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </Wrapper>
  );
}

export default function PublicCompaniesPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <PublicCompaniesInner />
    </Suspense>
  );
}
