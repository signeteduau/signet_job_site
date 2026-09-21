"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FileUploadField } from "@/app/components/signet/shimmer";
import { useAuth } from "@/context/auth-context";
import { SIGNET_SUPPORT_EMAIL } from "@/lib/contact";

const TOPICS = [
  "Account or login",
  "Jobs and applications",
  "Profile or resume",
  "Something else",
];

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SupportForm() {
  const { user } = useAuth();
  const [topic, setTopic] = useState(TOPICS[0]);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const subject = encodeURIComponent(`Signet support: ${topic}`);
    const attachmentLine = file
      ? `\n\nAttachment: ${file.name} (${formatFileSize(file.size)}). Please attach this file before sending.`
      : "";
    const body = encodeURIComponent(
      `Account email: ${email.trim()}\nTopic: ${topic}\n\n${message.trim()}${attachmentLine}`
    );
    if (file) {
      toast.info("Your email app will open. Attach the selected file before sending.");
    }
    window.location.href = `mailto:${SIGNET_SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <form className="nk-help-form" onSubmit={submit}>
      <div className="signet-field">
        <label htmlFor="support-topic">Topic</label>
        <select
          id="support-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        >
          {TOPICS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div className="signet-field">
        <label htmlFor="support-email">Your email</label>
        <input
          id="support-email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="signet-field">
        <label htmlFor="support-message">How can we help</label>
        <textarea
          id="support-message"
          required
          rows={6}
          placeholder="Tell us what you need help with. Include the page you were on if you can."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      <FileUploadField
        label="Attachment (optional)"
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
        formatsHint="Screenshot, PDF, or DOC — up to 10 MB"
        selectedFileName={file?.name}
        onFile={(next) => {
          if (next.size > MAX_ATTACHMENT_BYTES) {
            toast.error("Attachment must be under 10 MB.");
            setFile(null);
            return;
          }
          if (next.size === 0) {
            toast.error("That file appears to be empty.");
            setFile(null);
            return;
          }
          setFile(next);
        }}
      />
      <button type="submit" className="nk-btn nk-btn-register">
        Email support
      </button>
      <p className="nk-help-form-note">
        This opens your email app addressed to {SIGNET_SUPPORT_EMAIL}.
        {file ? " Attach the selected file in that email before you send it." : ""}
      </p>
    </form>
  );
}
