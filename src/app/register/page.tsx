"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { FirebaseError } from "firebase/app";
import AuthShell, { AuthRoleTabs } from "@/app/components/signet/auth-shell";
import { useAuth } from "@/context/auth-context";
import { UserType } from "@/types/firestore";
import Wrapper from "@/layouts/wrapper";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [userType, setUserType] = useState<UserType>("candidate");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

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
      });
      toast.success("Account created! Please verify your email.");
      router.push("/verify-email");
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
          <button className="signet-btn w-100" disabled={loading} type="submit">
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="signet-auth-switch">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </AuthShell>
    </Wrapper>
  );
}
