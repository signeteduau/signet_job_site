"use client";
import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import AuthShell, { AuthRoleTabs } from "@/app/components/signet/auth-shell";
import { PageLoader } from "@/app/components/signet/shimmer";
import { useAuth } from "@/context/auth-context";
import { withReturnUrl } from "@/lib/auth-flow";
import { createUserProfile } from "@/lib/services/users";
import { UserType } from "@/types/firestore";
import Wrapper from "@/layouts/wrapper";

function RoleSelectInner() {
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const returnUrl = search?.get("returnUrl");
  const [userType, setUserType] = useState<UserType>("candidate");
  const [loading, setLoading] = useState(false);

  const continueWithRole = async () => {
    if (!user) return router.push("/login");
    setLoading(true);
    try {
      await createUserProfile({
        uid: user.uid,
        email: user.email || "",
        fullName: user.displayName || "User",
        userType,
        companyName:
          userType === "company" ? user.displayName || "Company" : undefined,
      });
      await refreshProfile();
      router.push(withReturnUrl("/profile-setup", returnUrl));
    } catch {
      toast.error("Could not save role. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      <AuthShell
        showTabs={false}
        title="How will you use Signet?"
        subtitle="Pick a path now — you can finish your profile next."
      >
        <AuthRoleTabs value={userType} onChange={setUserType} />
        <button
          type="button"
          className="signet-btn w-100 mt-3"
          disabled={loading}
          onClick={continueWithRole}
        >
          {loading ? "Saving…" : `Continue as ${userType}`}
        </button>
      </AuthShell>
    </Wrapper>
  );
}

export default function RoleSelectPage() {
  return (
    <Suspense fallback={<PageLoader label="Loading…" />}>
      <RoleSelectInner />
    </Suspense>
  );
}
