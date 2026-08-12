"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageLoader } from "@/app/components/signet/shimmer";
import Wrapper from "@/layouts/wrapper";

export default function CandidateJobsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/jobs");
  }, [router]);

  return (
    <Wrapper>
      <PageLoader label="Opening jobs…" />
    </Wrapper>
  );
}
