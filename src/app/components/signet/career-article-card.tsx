"use client";

import Link from "next/link";
import { useState } from "react";
import {
  estimateReadMinutes,
  formatArticleDate,
  normalizeArticleImage,
} from "@/lib/article-utils";
import { Article } from "@/types/chat";

type Props = {
  article: Article;
  href?: string;
  variant?: "default" | "compact" | "spotlight";
};

function CardMedia({
  title,
  image,
  featured,
  variant,
}: {
  title: string;
  image?: string;
  featured?: boolean;
  variant: Props["variant"];
}) {
  const [failed, setFailed] = useState(false);
  const src = normalizeArticleImage(image);
  const showImage = !!src && !failed;

  return (
    <div className={`nk-career-card-media nk-career-card-media--${variant}`}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={title}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="nk-career-card-fallback" aria-hidden>
          <i className="bi bi-journal-richtext" />
        </div>
      )}
      {featured && <span className="nk-career-card-badge">Featured</span>}
    </div>
  );
}

export default function CareerArticleCard({
  article,
  href,
  variant = "default",
}: Props) {
  const link = href || `/career-tips/${article.id}`;
  const date = formatArticleDate(article.createdAt);
  const readMin = estimateReadMinutes(article.content);

  return (
    <Link
      href={link}
      className={`nk-career-card nk-career-card--${variant}`}
    >
      <CardMedia
        title={article.title}
        image={article.image}
        featured={article.featured}
        variant={variant}
      />

      <div className="nk-career-card-body">
        <div className="nk-career-card-meta">
          {article.tags?.[0] && (
            <span className="nk-career-card-topic">{article.tags[0]}</span>
          )}
          {date && <span className="nk-career-card-date">{date}</span>}
          <span className="nk-career-card-read">{readMin} min read</span>
        </div>

        <h3>{article.title}</h3>
        <p>{article.subtitle || "Practical career advice from Signet"}</p>

        {variant !== "compact" && (
          <span className="nk-career-card-cta">
            Read tip <i className="bi bi-arrow-right" aria-hidden />
          </span>
        )}
      </div>
    </Link>
  );
}
