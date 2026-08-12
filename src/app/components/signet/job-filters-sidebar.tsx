"use client";

import React from "react";
import { JOB_TYPES } from "@/lib/job-utils";

export type JobFilters = {
  term: string;
  type: string;
  location: string;
  experience: string;
  category: string;
  priority: string;
};

type Props = {
  filters: JobFilters;
  locations: string[];
  categories: string[];
  onChange: (patch: Partial<JobFilters>) => void;
  onClear: () => void;
};

const EXPERIENCE_OPTIONS = [
  "Fresher",
  "0-1",
  "1-3",
  "3-5",
  "5+",
] as const;

const PRIORITY_OPTIONS = ["High", "Medium", "Low"] as const;

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

export default function JobFiltersSidebar({
  filters,
  locations,
  categories,
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

      <FilterGroup title="Job type">
        <div className="nk-filter-checks">
          {JOB_TYPES.map((t) => (
            <label key={t} className="nk-filter-check">
              <input
                type="radio"
                name="job-type"
                checked={filters.type === t}
                onChange={() => onChange({ type: filters.type === t ? "" : t })}
              />
              <span>{t}</span>
            </label>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Experience">
        <div className="nk-filter-checks">
          {EXPERIENCE_OPTIONS.map((exp) => (
            <label key={exp} className="nk-filter-check">
              <input
                type="radio"
                name="experience"
                checked={filters.experience === exp}
                onChange={() =>
                  onChange({ experience: filters.experience === exp ? "" : exp })
                }
              />
              <span>{exp === "0-1" ? "0-1 years" : exp === "5+" ? "5+ years" : exp}</span>
            </label>
          ))}
        </div>
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
                  name="location-pick"
                  checked={filters.location === loc}
                  onChange={() =>
                    onChange({ location: filters.location === loc ? "" : loc })
                  }
                />
                <span>{loc}</span>
              </label>
            ))}
          </div>
        )}
      </FilterGroup>

      {categories.length > 0 && (
        <FilterGroup title="Department">
          <div className="nk-filter-checks">
            {categories.slice(0, 10).map((cat) => (
              <label key={cat} className="nk-filter-check">
                <input
                  type="radio"
                  name="category"
                  checked={filters.category === cat}
                  onChange={() =>
                    onChange({ category: filters.category === cat ? "" : cat })
                  }
                />
                <span>{cat}</span>
              </label>
            ))}
          </div>
        </FilterGroup>
      )}

      <FilterGroup title="Priority" defaultOpen={false}>
        <div className="nk-filter-checks">
          {PRIORITY_OPTIONS.map((p) => (
            <label key={p} className="nk-filter-check">
              <input
                type="radio"
                name="priority"
                checked={filters.priority === p}
                onChange={() =>
                  onChange({ priority: filters.priority === p ? "" : p })
                }
              />
              <span>{p}</span>
            </label>
          ))}
        </div>
      </FilterGroup>
    </aside>
  );
}
