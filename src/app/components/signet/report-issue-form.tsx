"use client";

import React, { useState } from "react";
import { SIGNET_SUPPORT_EMAIL } from "@/lib/contact";

const ISSUE_TYPES = [
  "Account or login",
  "Job posting",
  "Application",
  "Messaging",
  "Profile or resume",
  "Something else",
];

export default function ReportIssueForm() {
  const [type, setType] = useState(ISSUE_TYPES[0]);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const subject = encodeURIComponent(`Signet issue: ${type}`);
    const body = encodeURIComponent(
      `Account email: ${email.trim()}\nIssue type: ${type}\n\n${message.trim()}`
    );
    window.location.href = `mailto:${SIGNET_SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <form className="nk-help-form" onSubmit={submit}>
      <div className="signet-field">
        <label htmlFor="report-type">Issue type</label>
        <select
          id="report-type"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {ISSUE_TYPES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div className="signet-field">
        <label htmlFor="report-email">Your email</label>
        <input
          id="report-email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="signet-field">
        <label htmlFor="report-message">What happened</label>
        <textarea
          id="report-message"
          required
          rows={6}
          placeholder="Tell us the page you were on and what went wrong."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      <button type="submit" className="nk-btn nk-btn-register">
        Send report
      </button>
      <p className="nk-help-form-note">
        This opens your email app addressed to {SIGNET_SUPPORT_EMAIL}.
      </p>
    </form>
  );
}
