"use client";
import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { FirebaseError } from "firebase/app";
import ErrorMsg from "../common/error-msg";
import icon from "@/assets/images/icon/icon_60.svg";
import { resolveHomePath, useAuth } from "@/context/auth-context";
import { auth } from "@/lib/firebase";
import { getUserProfile } from "@/lib/services/users";

const LoginForm = () => {
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { login } = useAuth();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      toast.success("Welcome back!");
      const u = auth.currentUser;
      const p = u ? await getUserProfile(u.uid) : null;
      router.push(resolveHomePath(p, u));
    } catch (err) {
      const message =
        err instanceof FirebaseError
          ? "Invalid email or password."
          : "Something went wrong.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-10">
      <div className="row">
        <div className="col-12">
          <div className="input-group-meta position-relative mb-25">
            <label>Email*</label>
            <input
              type="email"
              placeholder="james@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              name="email"
            />
          </div>
        </div>
        <div className="col-12">
          <div className="input-group-meta position-relative mb-20">
            <label>Password*</label>
            <input
              type={showPass ? "text" : "password"}
              placeholder="Enter Password"
              className="pass_log_id"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              name="password"
            />
            <span
              className="placeholder_icon"
              onClick={() => setShowPass(!showPass)}
            >
              <span className={`passVicon ${showPass ? "eye-slash" : ""}`}>
                <Image src={icon} alt="icon" />
              </span>
            </span>
          </div>
        </div>
        {error && (
          <div className="col-12 mb-2">
            <ErrorMsg msg={error} />
          </div>
        )}
        <div className="col-12">
          <button
            type="submit"
            disabled={loading}
            className="btn-eleven fw-500 tran3s d-block mt-20"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default LoginForm;
