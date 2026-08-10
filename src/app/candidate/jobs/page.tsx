"use client";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import AuthGate from "@/app/components/signet/auth-gate";
import AppShell from "@/app/components/signet/app-shell";
import JobCard from "@/app/components/signet/job-card";
import { JobListShimmer } from "@/app/components/signet/shimmer";
import { useAuth } from "@/context/auth-context";
import { JOB_TYPES } from "@/lib/job-utils";
import { searchJobs } from "@/lib/services/jobs";
import { isJobSaved, saveJob, unsaveJob } from "@/lib/services/saved-jobs";
import { Job } from "@/types/firestore";
import Wrapper from "@/layouts/wrapper";

function JobsInner() {
  const { user } = useAuth();
  const [term, setTerm] = useState("");
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [experience, setExperience] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const load = async (overrides?: {
    term?: string;
    type?: string;
    location?: string;
    priority?: string;
    category?: string;
    experience?: string;
  }) => {
    setLoading(true);
    try {
      const list = await searchJobs({
        term: overrides?.term ?? term,
        type: overrides?.type ?? type,
        location: overrides?.location ?? location,
        priority: overrides?.priority ?? priority,
        category: overrides?.category ?? category,
        experience: overrides?.experience ?? experience,
      });
      setJobs(list);
      if (user) {
        const entries = await Promise.all(
          list.map(async (j) => [j.id, await isJobSaved(user.uid, j.id)] as const)
        );
        setSavedMap(Object.fromEntries(entries));
      }
    } catch {
      toast.error("Could not search jobs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const clearFilters = () => {
    setPriority("");
    setCategory("");
    setExperience("");
    setType("");
    setLocation("");
    setTerm("");
    load({
      term: "",
      type: "",
      location: "",
      priority: "",
      category: "",
      experience: "",
    });
  };

  return (
    <AppShell role="candidate" title="Jobs">
      <form
        className="signet-search-row"
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
      >
        <input
          placeholder="Search title, company, skills…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          {JOB_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <button className="signet-btn" type="submit">
          Search
        </button>
      </form>

      <div className="mb-3">
        <button
          type="button"
          className="signet-btn secondary"
          onClick={() => setShowMore((v) => !v)}
        >
          {showMore ? "Hide filters" : "More filters"}
        </button>
      </div>

      {showMore && (
        <div className="signet-search-row mb-3">
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="">All priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <input
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <select
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
          >
            <option value="">Any experience</option>
            <option value="Fresher">Fresher</option>
            <option value="0-1">0-1 years</option>
            <option value="1-3">1-3 years</option>
            <option value="3-5">3-5 years</option>
            <option value="5+">5+ years</option>
          </select>
          <button className="signet-btn secondary" type="button" onClick={clearFilters}>
            Clear
          </button>
        </div>
      )}

      <p style={{ color: "#6B7280" }} className="mb-3">
        {jobs.length} active jobs found
      </p>

      {loading && <JobListShimmer count={5} />}
      {!loading && jobs.length === 0 && (
        <div className="signet-empty">
          <h4>No jobs found</h4>
          <p>Try adjusting your filters.</p>
        </div>
      )}
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          saved={!!savedMap[job.id]}
          onSaveToggle={async () => {
            if (!user) return;
            try {
              if (savedMap[job.id]) {
                await unsaveJob(user.uid, job.id);
                setSavedMap((m) => ({ ...m, [job.id]: false }));
              } else {
                await saveJob(user.uid, job);
                setSavedMap((m) => ({ ...m, [job.id]: true }));
              }
            } catch {
              toast.error("Could not update saved job.");
            }
          }}
        />
      ))}
    </AppShell>
  );
}

export default function CandidateJobsPage() {
  return (
    <Wrapper>
      <AuthGate role="candidate">
        <JobsInner />
      </AuthGate>
    </Wrapper>
  );
}
