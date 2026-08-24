"use client";

import { useEffect, useState } from "react";
import { sanitizeArticleHtml } from "@/lib/article-utils";

type Props = {
  content?: string;
};

export default function CareerArticleBody({ content }: Props) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    setHtml(sanitizeArticleHtml(content));
  }, [content]);

  if (!html) return null;

  return (
    <div
      className="nk-career-article-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
