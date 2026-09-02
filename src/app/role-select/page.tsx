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

const STUDENT_CHECK_LABEL = "I am Signet student";

function RoleSelectInner() {
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const returnUrl = search?.get("returnUrl");
  const [userType, setUserType] = useState<UserType>("candidate");
  const [isStudent, setIsStudent] = useState(false);
  const [usid, setUsid] = useState("");
  const [loading, setLoading] = useState(false);

  const continueWithRole = async () => {
    if (!user) return router.push("/login");
    if (userType === "candidate" && isStudent && !usid.trim()) {
      toast.error("Enter your Unique Student Identifier.");
      return;
    }
    setLoading(true);
    try {
      await createUserProfile({
        uid: user.uid,
        email: user.email || "",
        fullName: user.displayName || "User",
        userType,
        companyName:
          userType === "company" ? user.displayName || "Company" : undefined,
        isStudent: userType === "candidate" ? isStudent : undefined,
        usid: userType === "candidate" && isStudent ? usid : undefined,
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
        {userType === "candidate" ? (
          <>
            <label className="signet-student-check">
              <input
                type="checkbox"
                checked={isStudent}
                onChange={(e) => {
                  setIsStudent(e.target.checked);
                  if (!e.target.checked) setUsid("");
                }}
              />
              <span className="signet-student-box" aria-hidden>
                <i className="bi bi-check2" />
              </span>
              <span className="signet-student-copy">
                <strong>{STUDENT_CHECK_LABEL}</strong>
              </span>
            </label>
            {isStudent ? (
              <div className="signet-field">
                <label>Unique Student Identifier</label>
                <input
                  required
                  value={usid}
                  onChange={(e) => setUsid(e.target.value)}
                  placeholder="Enter your Unique Student Identifier"
                  autoComplete="off"
                />
              </div>
            ) : null}
          </>
        ) : null}
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
