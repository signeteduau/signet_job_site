"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import AuthShell, { AuthRoleTabs } from "@/app/components/signet/auth-shell";
import { useAuth } from "@/context/auth-context";
import { createUserProfile } from "@/lib/services/users";
import { UserType } from "@/types/firestore";
import Wrapper from "@/layouts/wrapper";

export default function RoleSelectPage() {
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
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
      router.push("/profile-setup");
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
