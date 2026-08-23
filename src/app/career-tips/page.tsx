"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import CareerArticleCard from "@/app/components/signet/career-article-card";
import PublicSiteNav from "@/app/components/signet/public-site-nav";
import { PageLoader, PanelShimmer } from "@/app/components/signet/shimmer";
import { fetchArticles } from "@/lib/services/articles";
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

  const tags = useMemo(() => {
    const set = new Set<string>();
    articles.forEach((a) => (a.tags || []).forEach((t) => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [articles]);

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
        article.content,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [articles, term, activeTag]);

  const spotlight = useMemo(() => {
    if (term || activeTag) return null;
    return filtered.find((a) => a.featured) || filtered[0] || null;
  }, [filtered, term, activeTag]);

  const gridArticles = useMemo(() => {
    if (!spotlight) return filtered;
    return filtered.filter((a) => a.id !== spotlight.id);
  }, [filtered, spotlight]);

  const featuredGrid = useMemo(
    () => gridArticles.filter((a) => a.featured).slice(0, 3),
    [gridArticles]
  );

  const restGrid = useMemo(
    () =>
      gridArticles.filter((a) => !featuredGrid.some((f) => f.id === a.id)),
    [gridArticles, featuredGrid]
  );

  const applyFilters = (next: { q?: string; tag?: string }) => {
    const params = new URLSearchParams();
    const q = next.q ?? term;
    const tag = next.tag ?? activeTag;
    if (q.trim()) params.set("q", q.trim());
    if (tag.trim()) params.set("tag", tag.trim());
    const qs = params.toString();
    router.push(qs ? `/career-tips?${qs}` : "/career-tips");
  };

  const resultsLabel = activeTag
    ? `Articles tagged “${activeTag}”`
    : term
    ? `Results for “${term}”`
    : "Latest articles";

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
            <div className="nk-career-hero-copy">
              <p className="nk-career-kicker">
                <i className="bi bi-lightbulb" aria-hidden /> Career Tips
              </p>
              <h1>Grow your career with expert advice</h1>
              <p>
                Practical guides on resumes, interviews, salary, remote work, and
                landing your next role on Signet.
              </p>
              {!loading && (
                <div className="nk-career-hero-stats">
                  <span>
                    <strong>{articles.length}</strong> articles
                  </span>
                  <span className="dot" aria-hidden />
                  <span>
                    <strong>{tags.length}</strong> topics
                  </span>
                </div>
              )}
            </div>
            <form
              className="nk-career-hero-search"
              onSubmit={(e) => {
                e.preventDefault();
                applyFilters({ q: term, tag: activeTag });
              }}
            >
              <label className="nk-career-search-label">
                <i className="bi bi-search" aria-hidden />
                <input
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Search resume, interview, salary…"
                  aria-label="Search career tips"
                />
              </label>
              <button type="submit" className="nk-search-submit">
                Search
              </button>
            </form>
          </div>
        </section>

        <main className="nk-container nk-career-tips-main">
          {!!tags.length && (
            <div className="nk-career-tags-wrap">
              <p className="nk-career-tags-label">Browse by topic</p>
              <div className="nk-career-tags">
                <button
                  type="button"
                  className={`nk-career-tag${!activeTag ? " active" : ""}`}
                  onClick={() => {
                    setActiveTag("");
                    applyFilters({ tag: "", q: term });
                  }}
                >
                  All topics
                </button>
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`nk-career-tag${
                      activeTag.toLowerCase() === tag.toLowerCase() ? " active" : ""
                    }`}
                    onClick={() => {
                      setActiveTag(tag);
                      applyFilters({ tag, q: term });
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="nk-career-results-head">
            <div>
              <h2>{resultsLabel}</h2>
              <p>
                {loading
                  ? "Loading articles…"
                  : `${filtered.length} article${filtered.length === 1 ? "" : "s"} to explore`}
              </p>
            </div>
          </div>

          {loading && (
            <div className="nk-career-grid">
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
              <h4>No articles found</h4>
              <p>Try another search term or browse all topics.</p>
              <button
                type="button"
                className="signet-btn secondary mt-2"
                onClick={() => {
                  setTerm("");
                  setActiveTag("");
                  router.push("/career-tips");
                }}
              >
                View all articles
              </button>
            </div>
          )}

          {!loading && spotlight && (
            <section className="nk-career-spotlight-wrap">
              <CareerArticleCard article={spotlight} variant="spotlight" />
            </section>
          )}

          {!loading && featuredGrid.length > 0 && (
            <section className="nk-career-section">
              <div className="nk-career-section-head">
                <h3>Featured reads</h3>
                <p>Hand-picked guides to help you stand out</p>
              </div>
              <div className="nk-career-grid nk-career-grid--3">
                {featuredGrid.map((article) => (
                  <CareerArticleCard key={article.id} article={article} />
                ))}
              </div>
            </section>
          )}

          {!loading && restGrid.length > 0 && (
            <section className="nk-career-section">
              <div className="nk-career-section-head">
                <h3>{featuredGrid.length ? "More to read" : "All articles"}</h3>
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
