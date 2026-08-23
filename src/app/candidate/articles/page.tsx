"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CandidateArticlesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/career-tips");
  }, [router]);

  return null;
}
