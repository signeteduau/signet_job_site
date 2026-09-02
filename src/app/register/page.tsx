"use client";
import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { FirebaseError } from "firebase/app";
import AuthShell, { AuthRoleTabs } from "@/app/components/signet/auth-shell";
import GoogleAuthButton from "@/app/components/signet/google-auth-button";
import { PageLoader } from "@/app/components/signet/shimmer";
import { useAuth } from "@/context/auth-context";
import { resolvePostLoginPath, withReturnUrl } from "@/lib/auth-flow";
import { auth } from "@/lib/firebase";
import { getUserProfile } from "@/lib/services/users";
import { UserType } from "@/types/firestore";
import Wrapper from "@/layouts/wrapper";

const STUDENT_CHECK_LABEL = "I am Signet student";

function RegisterInner() {
  const { register } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const returnUrl = search?.get("returnUrl");
  const [userType, setUserType] = useState<UserType>(
    search?.get("type") === "company" ? "company" : "candidate"
  );
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [usid, setUsid] = useState("");

  const goNext = async () => {
    const u = auth.currentUser;
    if (!u) return router.push("/login");
    const p = await getUserProfile(u.uid);
    router.push(resolvePostLoginPath(p, u, returnUrl));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({
        name: userType === "company" ? companyName || name : name,
        email,
        password,
        userType,
        companyName: userType === "company" ? companyName || name : undefined,
        isStudent: userType === "candidate" ? isStudent : undefined,
        usid: userType === "candidate" && isStudent ? usid : undefined,
      });
      toast.success("Account created! Please verify your email.");
      router.push(withReturnUrl("/verify-email", returnUrl));
    } catch (err) {
      let message = "Could not create account.";
      if (err instanceof FirebaseError) {
        if (err.code === "auth/email-already-in-use") {
          message = "An account with this email already exists.";
        } else if (err.code === "auth/weak-password") {
          message = "Password should be at least 6 characters.";
        }
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      <AuthShell
        title="Create your account"
        subtitle="Choose how you’ll use Signet, then set up access."
      >
        <AuthRoleTabs value={userType} onChange={setUserType} />

        <GoogleAuthButton
          mode="signup"
          userType={userType}
          companyName={companyName}
          isStudent={userType === "candidate" ? isStudent : undefined}
          usid={userType === "candidate" && isStudent ? usid : undefined}
          returnUrl={returnUrl}
          onBeforeSignIn={() => {
            if (userType === "company" && !companyName.trim()) {
              toast.error("Enter your company name first.");
              return false;
            }
            if (userType === "candidate" && isStudent && !usid.trim()) {
              toast.error("Enter your Unique Student Identifier.");
              return false;
            }
            return true;
          }}
          onSuccess={goNext}
        />

        <div className="signet-auth-divider">
          <span>or</span>
        </div>

        <form onSubmit={onSubmit} className="signet-auth-form">
          {userType === "company" ? (
            <div className="signet-field">
              <label>Company name</label>
              <input
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Pty Ltd"
              />
            </div>
          ) : (
            <div className="signet-field">
              <label>Full name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Smith"
              />
            </div>
          )}
          <div className="signet-field">
            <label>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div className="signet-field">
            <label>Password</label>
            <div className="signet-input-wrap">
              <input
                type={showPass ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="signet-input-action"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                <i className={`bi ${showPass ? "bi-eye-slash" : "bi-eye"}`} />
              </button>
            </div>
          </div>
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
          <button className="signet-btn w-100" disabled={loading} type="submit">
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="signet-auth-switch">
          Already have an account?{" "}
          <Link
            href={
              returnUrl
                ? `/login?returnUrl=${encodeURIComponent(returnUrl)}`
                : "/login"
            }
          >
            Sign in
          </Link>
        </p>
      </AuthShell>
    </Wrapper>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<PageLoader label="Loading…" />}>
      <RegisterInner />
    </Suspense>
  );
}
