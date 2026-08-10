"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import AuthGate from "@/app/components/signet/auth-gate";
import AppShell from "@/app/components/signet/app-shell";
import { PanelShimmer } from "@/app/components/signet/shimmer";
import { fetchArticles } from "@/lib/services/articles";
import { Article } from "@/types/chat";
import Wrapper from "@/layouts/wrapper";

function Inner() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles()
      .then(setArticles)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell role="candidate" title="Career articles">
      {loading && (
        <div className="row">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="col-md-6">
              <PanelShimmer rows={3} />
            </div>
          ))}
        </div>
      )}
      {!loading && articles.length === 0 && (
        <div className="signet-empty signet-panel">
          <h4>No articles yet</h4>
          <p>Career tips from Signet will show up here.</p>
        </div>
      )}
      <div className="row">
        {articles.map((a) => (
          <div key={a.id} className="col-md-6">
            <Link href={`/candidate/articles/${a.id}`} className="signet-article-card">
              {a.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="thumb" src={a.image} alt={a.title} />
              )}
              <div className="body">
                {a.featured && <span className="signet-status mb-2">Featured</span>}
                <h3>{a.title}</h3>
                <p>{a.subtitle || a.author}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

export default function ArticlesPage() {
  return (
    <Wrapper>
      <AuthGate role="candidate">
        <Inner />
      </AuthGate>
    </Wrapper>
  );
}
