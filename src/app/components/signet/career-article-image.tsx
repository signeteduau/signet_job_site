"use client";

import { useState } from "react";
import { normalizeArticleImage } from "@/lib/article-utils";

type Props = {
  src?: string;
  alt: string;
  className?: string;
};

export default function CareerArticleImage({ src, alt, className }: Props) {
  const [failed, setFailed] = useState(false);
  const normalized = normalizeArticleImage(src);

  if (!normalized || failed) {
    return (
      <div className={`nk-career-card-fallback ${className || ""}`.trim()} aria-hidden>
        <i className="bi bi-journal-richtext" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      src={normalized}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
