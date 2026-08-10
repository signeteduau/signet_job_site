"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { FirebaseError } from "firebase/app";
import AuthShell from "@/app/components/signet/auth-shell";
import { resolveHomePath, useAuth } from "@/context/auth-context";
import { auth } from "@/lib/firebase";
import { getUserProfile } from "@/lib/services/users";
import Wrapper from "@/layouts/wrapper";

export default function LoginPage() {
  const { login, loginWithGoogle, resetPassword } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  const goNext = async () => {
    const u = auth.currentUser;
    if (!u) return router.push("/login");
    const p = await getUserProfile(u.uid);
    router.push(resolveHomePath(p, u));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      await goNext();
    } catch (err) {
      toast.error(
        err instanceof FirebaseError
          ? "Invalid email or password."
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      <AuthShell
        title="Welcome back"
        subtitle="Sign in to continue to your Signet workspace."
      >
        <form onSubmit={onSubmit} className="signet-auth-form">
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
                placeholder="••••••••"
                autoComplete="current-password"
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
            <div className="d-flex justify-content-end mt-2">
              <button
                type="button"
                className="signet-text-link border-0 bg-transparent p-0"
                disabled={resetting}
                onClick={async () => {
                  if (!email.trim()) {
                    toast.error("Enter your email first.");
                    return;
                  }
                  setResetting(true);
                  try {
                    await resetPassword(email.trim());
                    toast.success("Password reset email sent.");
                  } catch {
                    toast.error("Could not send reset email.");
                  } finally {
                    setResetting(false);
                  }
                }}
              >
                {resetting ? "Sending…" : "Forgot password?"}
              </button>
            </div>
          </div>
          <button className="signet-btn w-100" disabled={loading} type="submit">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="signet-auth-divider">
          <span>or</span>
        </div>

        <button
          type="button"
          className="signet-btn google w-100"
          disabled={googleLoading}
          onClick={async () => {
            setGoogleLoading(true);
            try {
              await loginWithGoogle();
              await goNext();
            } catch {
              toast.error("Google sign-in failed or was cancelled.");
            } finally {
              setGoogleLoading(false);
            }
          }}
        >
          <i className="bi bi-google" />
          {googleLoading ? "Connecting…" : "Continue with Google"}
        </button>

        <p className="signet-auth-switch">
          New here? <Link href="/register">Create an account</Link>
        </p>
      </AuthShell>
    </Wrapper>
  );
}
