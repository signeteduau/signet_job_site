"use client";

import { Suspense, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { PageLoader } from "@/app/components/signet/shimmer";

function RedirectInner() {
  const router = useRouter();
  const params = useParams();
  const search = useSearchParams();
  const id = String(params?.id || "");
  const embed = search?.get("embed");
  const webview = search?.get("webview");

  useEffect(() => {
    const qs = new URLSearchParams();
    if (embed) qs.set("embed", embed);
    if (webview) qs.set("webview", webview);
    const suffix = qs.toString();
    router.replace(
      suffix ? `/career-tips/${id}?${suffix}` : `/career-tips/${id}`
    );
  }, [router, id, embed, webview]);

  return null;
}

export default function CandidateArticleRedirectPage() {
  return (
    <Suspense fallback={<PageLoader label="Redirecting…" />}>
      <RedirectInner />
    </Suspense>
  );
}
