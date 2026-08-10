"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AuthGate from "@/app/components/signet/auth-gate";
import AppShell from "@/app/components/signet/app-shell";
import { PanelShimmer } from "@/app/components/signet/shimmer";
import { fetchArticleById } from "@/lib/services/articles";
import { Article } from "@/types/chat";
import Wrapper from "@/layouts/wrapper";

function Inner() {
  const params = useParams();
  const id = String(params?.id || "");
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setArticle(await fetchArticleById(id));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <AppShell role="candidate" title="Article">
      <Link href="/candidate/articles" className="signet-btn secondary mb-3">
        ← Back
      </Link>
      {loading && <PanelShimmer rows={8} />}
      {!loading && !article && (
        <div className="signet-empty">
          <h4>Article not found</h4>
          <p>It may have been removed.</p>
        </div>
      )}
      {!loading && article && (
        <article className="signet-panel">
          {article.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.image}
              alt={article.title}
              style={{
                width: "100%",
                borderRadius: 16,
                maxHeight: 280,
                objectFit: "cover",
                marginBottom: 16,
              }}
            />
          )}
          <h2 style={{ color: "#12141A", fontWeight: 800 }}>{article.title}</h2>
          <p style={{ color: "#6B7280" }}>
            {article.author && `By ${article.author}`}
            {article.subtitle ? ` · ${article.subtitle}` : ""}
          </p>
          {!!article.tags?.length && (
            <div className="signet-tags mb-3">
              {article.tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          )}
          <p style={{ whiteSpace: "pre-wrap", color: "#374151", lineHeight: 1.7 }}>
            {article.content}
          </p>
        </article>
      )}
    </AppShell>
  );
}

export default function ArticleDetailPage() {
  return (
    <Wrapper>
      <AuthGate role="candidate">
        <Inner />
      </AuthGate>
    </Wrapper>
  );
}
