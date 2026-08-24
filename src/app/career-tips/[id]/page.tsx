"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import CareerArticleCard from "@/app/components/signet/career-article-card";
import CareerArticleImage from "@/app/components/signet/career-article-image";
import CareerArticleBody from "@/app/components/signet/career-article-body";
import CareerArticleShare from "@/app/components/signet/career-article-share";
import PublicSiteNav from "@/app/components/signet/public-site-nav";
import { PageLoader, PanelShimmer } from "@/app/components/signet/shimmer";
import {
  estimateReadMinutes,
  formatArticleDate,
} from "@/lib/article-utils";
import { fetchArticleById, fetchArticles } from "@/lib/services/articles";
import { Article } from "@/types/chat";
import Wrapper from "@/layouts/wrapper";

function CareerArticleInner() {
  const params = useParams();
  const search = useSearchParams();
  const id = String(params?.id || "");
  const embed =
    search?.get("embed") === "1" || search?.get("webview") === "1";

  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [found, all] = await Promise.all([
          fetchArticleById(id),
          fetchArticles(40),
        ]);
        if (!alive) return;
        setArticle(found);
        if (found) {
          const tags = new Set((found.tags || []).map((t) => t.toLowerCase()));
          const picks = all
            .filter((a) => a.id !== found.id)
            .map((a) => ({
              article: a,
              score: (a.tags || []).filter((t) => tags.has(t.toLowerCase())).length,
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map((entry) => entry.article);
          setRelated(
            picks.length ? picks : all.filter((a) => a.id !== found.id).slice(0, 3)
          );
        } else {
          setRelated([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const dateLabel = useMemo(
    () => formatArticleDate(article?.createdAt),
    [article?.createdAt]
  );

  const readMin = useMemo(
    () => estimateReadMinutes(article?.content),
    [article?.content]
  );

  return (
    <Wrapper>
      <div
        className={`signet-site nk-browse-page nk-career-tips-page${
          embed ? " is-embed" : ""
        }`}
      >
        {!embed && (
          <>
            <div className="signet-ambient" aria-hidden />
            <PublicSiteNav variant="browse" />
          </>
        )}

        <main
          className={`nk-career-article-shell${embed ? " is-embed" : ""}`}
        >
          {!embed && (
            <div className="nk-container">
              <Link href="/career-tips" className="nk-career-back-link">
                <i className="bi bi-arrow-left" aria-hidden /> Back to Career Tips
              </Link>
            </div>
          )}

          {loading && (
            <div className="nk-container">
              <PanelShimmer rows={12} />
            </div>
          )}

          {!loading && !article && (
            <div className="nk-container">
              <div className="signet-empty nk-career-empty">
                <span className="nk-career-empty-icon" aria-hidden>
                  <i className="bi bi-journal-x" />
                </span>
                <h4>Article not found</h4>
                <p>It may have been removed or the link is incorrect.</p>
                {!embed && (
                  <Link href="/career-tips" className="signet-btn mt-2">
                    Browse Career Tips
                  </Link>
                )}
              </div>
            </div>
          )}

          {!loading && article && (
            <>
              <div className="nk-container nk-career-article-layout">
                <article className="nk-career-article">
                  <div className="nk-career-article-cover">
                    <CareerArticleImage src={article.image} alt={article.title} />
                  </div>

                  <div className="nk-career-article-panel">
                    <header className="nk-career-article-header">
                      <div className="nk-career-article-labels">
                        {article.featured && (
                          <span className="nk-career-article-label is-featured">
                            Featured
                          </span>
                        )}
                        {article.tags?.map((tag) => (
                          <Link
                            key={tag}
                            href={`/career-tips?tag=${encodeURIComponent(tag)}`}
                            className="nk-career-article-label"
                          >
                            {tag}
                          </Link>
                        ))}
                      </div>

                      <h1>{article.title}</h1>
                      {article.subtitle && (
                        <p className="nk-career-article-lead">{article.subtitle}</p>
                      )}

                      <div className="nk-career-article-meta-bar">
                        <div className="nk-career-author-chip">
                          <span className="avatar" aria-hidden>
                            {(article.author || "S").slice(0, 1).toUpperCase()}
                          </span>
                          <div>
                            <strong>
                              {article.author || "Signet Employment Hub"}
                            </strong>
                            <span>
                              {dateLabel}
                              {dateLabel && " · "}
                              {readMin} min read
                            </span>
                          </div>
                        </div>
                      </div>
                    </header>

                    <CareerArticleBody content={article.content} />

                    {!embed && (
                      <CareerArticleShare
                        title={article.title}
                        articleId={article.id}
                      />
                    )}
                  </div>
                </article>

                {related.length > 0 && !embed && (
                  <aside className="nk-career-article-sidebar">
                    <div className="nk-career-sidebar-card">
                      <div className="nk-career-section-head">
                        <h3>Related reads</h3>
                        <p>More guides you might like</p>
                      </div>
                      <div className="nk-career-sidebar-list">
                        {related.map((item) => (
                          <CareerArticleCard
                            key={item.id}
                            article={item}
                            variant="compact"
                          />
                        ))}
                      </div>
                      <Link href="/career-tips" className="nk-career-sidebar-link">
                        View all articles
                      </Link>
                    </div>
                  </aside>
                )}
              </div>

              {related.length > 0 && !embed && (
                <section className="nk-container nk-career-article-related-mobile">
                  <div className="nk-career-section-head">
                    <h3>Related reads</h3>
                    <p>More guides you might like</p>
                  </div>
                  <div className="nk-career-grid nk-career-grid--3">
                    {related.map((item) => (
                      <CareerArticleCard key={item.id} article={item} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </Wrapper>
  );
}

export default function CareerArticlePage() {
  return (
    <Suspense fallback={<PageLoader label="Loading article…" />}>
      <CareerArticleInner />
    </Suspense>
  );
}
