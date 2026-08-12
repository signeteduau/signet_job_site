"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageLoader } from "@/app/components/signet/shimmer";
import Wrapper from "@/layouts/wrapper";

export default function CandidateJobDetailRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || "");

  useEffect(() => {
    if (id) router.replace(`/jobs/${id}`);
    else router.replace("/jobs");
  }, [id, router]);

  return (
    <Wrapper>
      <PageLoader label="Opening job…" />
    </Wrapper>
  );
}
