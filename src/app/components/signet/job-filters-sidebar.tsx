"use client";

import React, { useMemo, useState } from "react";
import { JOB_TYPES } from "@/lib/job-utils";

export type JobFilters = {
  term: string;
  types: string[];
  locations: string[];
  experience: string[];
  categories: string[];
  priorities: string[];
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

function toggleValue(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

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

function LocationChecks({
  locations,
  selected,
  onToggle,
}: {
  locations: string[];
  selected: string[];
  onToggle: (loc: string) => void;
}) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return locations.filter(
      (loc) => !q || loc.toLowerCase().includes(q) || selected.includes(loc)
    );
  }, [locations, query, selected]);

  return (
    <>
      <input
        className="nk-filter-search"
        placeholder="Search location"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {visible.length > 0 && (
        <div className="nk-filter-checks nk-filter-checks-scroll mt-2">
          {visible.map((loc) => (
            <label key={loc} className="nk-filter-check">
              <input
                type="checkbox"
                checked={selected.includes(loc)}
                onChange={() => onToggle(loc)}
              />
              <span>{loc}</span>
            </label>
          ))}
        </div>
      )}
    </>
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
      <div className="nk-browse-filters-scroll">
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
                type="checkbox"
                checked={filters.types.includes(t)}
                onChange={() =>
                  onChange({ types: toggleValue(filters.types, t) })
                }
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
                type="checkbox"
                checked={filters.experience.includes(exp)}
                onChange={() =>
                  onChange({
                    experience: toggleValue(filters.experience, exp),
                  })
                }
              />
              <span>
                {exp === "0-1" ? "0-1 year" : exp === "5+" ? "5+ years" : exp}
              </span>
            </label>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Location">
        <LocationChecks
          locations={locations}
          selected={filters.locations}
          onToggle={(loc) =>
            onChange({ locations: toggleValue(filters.locations, loc) })
          }
        />
      </FilterGroup>

      {categories.length > 0 && (
        <FilterGroup title="Department">
          <div className="nk-filter-checks nk-filter-checks-scroll">
            {categories.map((cat) => (
              <label key={cat} className="nk-filter-check">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(cat)}
                  onChange={() =>
                    onChange({
                      categories: toggleValue(filters.categories, cat),
                    })
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
                type="checkbox"
                checked={filters.priorities.includes(p)}
                onChange={() =>
                  onChange({
                    priorities: toggleValue(filters.priorities, p),
                  })
                }
              />
              <span>{p}</span>
            </label>
          ))}
        </div>
      </FilterGroup>
      </div>
    </aside>
  );
}
