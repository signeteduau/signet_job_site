"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import CareerArticleCard from "@/app/components/signet/career-article-card";
import PublicSiteNav from "@/app/components/signet/public-site-nav";
import { PageLoader, PanelShimmer } from "@/app/components/signet/shimmer";
import { fetchArticles } from "@/lib/services/articles";
import { stripHtml } from "@/lib/article-utils";
import { Article } from "@/types/chat";
import Wrapper from "@/layouts/wrapper";

function CareerTipsInner() {
  const router = useRouter();
  const search = useSearchParams();
  const initialQ = search?.get("q") || "";
  const initialTag = search?.get("tag") || "";

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [term, setTerm] = useState(initialQ);
  const [activeTag, setActiveTag] = useState(initialTag);

  useEffect(() => {
    setTerm(initialQ);
    setActiveTag(initialTag);
  }, [initialQ, initialTag]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const list = await fetchArticles(60);
        if (alive) setArticles(list);
      } catch {
        if (alive) setArticles([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    const tag = activeTag.trim().toLowerCase();
    return articles.filter((article) => {
      if (tag && !(article.tags || []).some((t) => t.toLowerCase() === tag)) {
        return false;
      }
      if (!q) return true;
      const hay = [
        article.title,
        article.subtitle,
        article.author,
        (article.tags || []).join(" "),
        stripHtml(article.content),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [articles, term, activeTag]);

  const featuredGrid = useMemo(
    () => filtered.filter((a) => a.featured).slice(0, 3),
    [filtered]
  );

  const latestGrid = useMemo(() => {
    const featuredIds = new Set(featuredGrid.map((a) => a.id));
    return filtered.filter((a) => !featuredIds.has(a.id)).slice(0, 3);
  }, [filtered, featuredGrid]);

  const restGrid = useMemo(() => {
    const shown = new Set([
      ...featuredGrid.map((a) => a.id),
      ...latestGrid.map((a) => a.id),
    ]);
    return filtered.filter((a) => !shown.has(a.id));
  }, [filtered, featuredGrid, latestGrid]);

  const applyFilters = (next: { q?: string; tag?: string }) => {
    const params = new URLSearchParams();
    const q = next.q ?? term;
    const tag = next.tag ?? activeTag;
    if (q.trim()) params.set("q", q.trim());
    if (tag.trim()) params.set("tag", tag.trim());
    const qs = params.toString();
    router.push(qs ? `/career-tips?${qs}` : "/career-tips");
  };

  const isFiltering = !!(term.trim() || activeTag.trim());
  const resultsLabel = activeTag
    ? `Articles tagged “${activeTag}”`
    : term
    ? `Results for “${term}”`
    : "Latest Tips";

  return (
    <Wrapper>
      <div className="signet-site nk-browse-page nk-career-tips-page">
        <div className="signet-ambient" aria-hidden />
        <PublicSiteNav variant="browse" />

        <section className="nk-career-hero-band">
          <div className="nk-career-hero-bg" aria-hidden>
            <span className="nk-career-hero-blob nk-career-hero-blob-a" />
            <span className="nk-career-hero-blob nk-career-hero-blob-b" />
          </div>
          <div className="nk-container nk-career-hero-inner">
            <h1 className="nk-career-hero-headline">
              <strong>Grow your career with expert advice</strong>
              <span className="nk-career-hero-headline-sep" aria-hidden> — </span>
              Practical guides on resumes, interviews, salary, remote work, and landing your next role on Signet.
            </h1>

            <form
              className="nk-search nk-career-hero-search"
              onSubmit={(e) => {
                e.preventDefault();
                applyFilters({ q: term, tag: activeTag });
              }}
            >
              <div className="nk-search-wrap">
                <div className="nk-search-shell nk-search-shell--single">
                  <div className="nk-search-segment nk-search-designation">
                    <label className="nk-search-designation-label">
                      <i className="bi bi-search" aria-hidden />
                      <input
                        value={term}
                        onChange={(e) => setTerm(e.target.value)}
                        placeholder="Search tips, topics, or keywords"
                        aria-label="Search career tips"
                      />
                    </label>
                    {term ? (
                      <button
                        type="button"
                        className="nk-search-clear"
                        aria-label="Clear search"
                        onClick={() => {
                          setTerm("");
                          applyFilters({ q: "", tag: activeTag });
                        }}
                      >
                        <i className="bi bi-x" />
                      </button>
                    ) : null}
                  </div>
                  <button type="submit" className="nk-search-submit">
                    Search
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>

        <main className="nk-container nk-career-tips-main">
          {(loading || isFiltering) && (
            <div className="nk-career-results-head">
              <div>
                <h2>{resultsLabel}</h2>
                <p>
                  {loading
                    ? "Loading tips…"
                    : `${filtered.length} tip${filtered.length === 1 ? "" : "s"} to explore`}
                </p>
              </div>
            </div>
          )}

          {loading && (
            <div className="nk-career-grid nk-career-grid--3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <PanelShimmer key={i} rows={5} />
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="signet-empty nk-career-empty">
              <span className="nk-career-empty-icon" aria-hidden>
                <i className="bi bi-journal-x" />
              </span>
              <h4>No tips found</h4>
              <p>Try another search term.</p>
              <button
                type="button"
                className="signet-btn secondary mt-2"
                onClick={() => {
                  setTerm("");
                  setActiveTag("");
                  router.push("/career-tips");
                }}
              >
                View all tips
              </button>
            </div>
          )}

          {!loading && isFiltering && filtered.length > 0 && (
            <section className="nk-career-section">
              <div className="nk-career-grid nk-career-grid--3">
                {filtered.map((article) => (
                  <CareerArticleCard key={article.id} article={article} />
                ))}
              </div>
            </section>
          )}

          {!loading && !isFiltering && latestGrid.length > 0 && (
            <section className="nk-career-section">
              <div className="nk-career-section-head">
                <h3>Latest Tips</h3>
                <p>Fresh career advice from Signet</p>
              </div>
              <div className="nk-career-grid nk-career-grid--3">
                {latestGrid.map((article) => (
                  <CareerArticleCard key={article.id} article={article} />
                ))}
              </div>
            </section>
          )}

          {!loading && !isFiltering && featuredGrid.length > 0 && (
            <section className="nk-career-section">
              <div className="nk-career-section-head">
                <h3>Featured Tips</h3>
                <p>Hand-picked guides to help you stand out</p>
              </div>
              <div className="nk-career-grid nk-career-grid--3">
                {featuredGrid.map((article) => (
                  <CareerArticleCard key={article.id} article={article} />
                ))}
              </div>
            </section>
          )}

          {!loading && !isFiltering && restGrid.length > 0 && (
            <section className="nk-career-section">
              <div className="nk-career-section-head">
                <h3>More tips</h3>
                <p>Insights for every stage of your job search</p>
              </div>
              <div className="nk-career-grid nk-career-grid--3">
                {restGrid.map((article) => (
                  <CareerArticleCard key={article.id} article={article} />
                ))}
              </div>
            </section>
          )}

          <div className="nk-career-tips-cta">
            <div className="nk-career-tips-cta-copy">
              <p className="nk-career-kicker">Take the next step</p>
              <h3>Ready to put this advice into action?</h3>
              <p>Browse open roles and apply with your Signet profile.</p>
            </div>
            <div className="nk-career-tips-cta-actions">
              <Link href="/jobs" className="nk-search-submit">
                Browse jobs
              </Link>
              <Link href="/register" className="nk-btn nk-btn-ghost">
                Create free account
              </Link>
            </div>
          </div>
        </main>
      </div>
    </Wrapper>
  );
}

export default function CareerTipsPage() {
  return (
    <Suspense fallback={<PageLoader label="Loading career tips…" />}>
      <CareerTipsInner />
    </Suspense>
  );
}
