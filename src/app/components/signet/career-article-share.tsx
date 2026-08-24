"use client";

import { useMemo, useState } from "react";
import { toast } from "react-toastify";

type Props = {
  title: string;
  articleId: string;
};

export default function CareerArticleShare({ title, articleId }: Props) {
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return `https://signetemploymenthub.com/career-tips/${articleId}`;
    }
    return `${window.location.origin}/career-tips/${articleId}`;
  }, [articleId]);

  const shareText = `${title} — Signet Career Tips`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied!");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link.");
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: shareUrl });
      } catch {
        // User cancelled or share failed silently.
      }
      return;
    }
    copyLink();
  };

  return (
    <footer className="nk-career-article-share">
      <p className="nk-career-article-share-label">Share this article</p>
      <div className="nk-career-article-share-actions">
        <button type="button" className="nk-career-share-btn" onClick={nativeShare}>
          <i className="bi bi-share" aria-hidden />
          Share
        </button>
        <button type="button" className="nk-career-share-btn" onClick={copyLink}>
          <i className="bi bi-link-45deg" aria-hidden />
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
    </footer>
  );
}
