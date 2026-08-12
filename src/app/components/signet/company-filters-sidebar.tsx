"use client";

import React from "react";

export type CompanyFilters = {
  term: string;
  industry: string;
  location: string;
  hiringOnly: boolean;
};

type Props = {
  filters: CompanyFilters;
  industries: string[];
  locations: string[];
  onChange: (patch: Partial<CompanyFilters>) => void;
  onClear: () => void;
};

function FilterGroup({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="nk-filter-group" open={defaultOpen}>
      <summary>{title}</summary>
      <div className="nk-filter-group-body">{children}</div>
    </details>
  );
}

export default function CompanyFiltersSidebar({
  filters,
  industries,
  locations,
  onChange,
  onClear,
}: Props) {
  return (
    <aside className="nk-browse-filters">
      <div className="nk-browse-filters-head">
        <h3>All filters</h3>
        <button type="button" className="nk-filter-clear" onClick={onClear}>
          Clear all
        </button>
      </div>

      <FilterGroup title="Industry">
        {industries.length > 0 ? (
          <div className="nk-filter-checks">
            {industries.slice(0, 12).map((industry) => (
              <label key={industry} className="nk-filter-check">
                <input
                  type="radio"
                  name="company-industry"
                  checked={filters.industry === industry}
                  onChange={() =>
                    onChange({
                      industry: filters.industry === industry ? "" : industry,
                    })
                  }
                />
                <span>{industry}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="nk-filter-empty">No industries listed yet.</p>
        )}
      </FilterGroup>

      <FilterGroup title="Location">
        <input
          className="nk-filter-search"
          placeholder="Search location"
          value={filters.location}
          onChange={(e) => onChange({ location: e.target.value })}
        />
        {locations.length > 0 && (
          <div className="nk-filter-checks mt-2">
            {locations.slice(0, 8).map((loc) => (
              <label key={loc} className="nk-filter-check">
                <input
                  type="radio"
                  name="company-location"
                  checked={filters.location === loc}
                  onChange={() =>
                    onChange({
                      location: filters.location === loc ? "" : loc,
                    })
                  }
                />
                <span>{loc}</span>
              </label>
            ))}
          </div>
        )}
      </FilterGroup>

      <FilterGroup title="Hiring status" defaultOpen={false}>
        <div className="nk-filter-checks">
          <label className="nk-filter-check">
            <input
              type="checkbox"
              checked={filters.hiringOnly}
              onChange={(e) => onChange({ hiringOnly: e.target.checked })}
            />
            <span>Actively hiring only</span>
          </label>
        </div>
      </FilterGroup>
    </aside>
  );
}
