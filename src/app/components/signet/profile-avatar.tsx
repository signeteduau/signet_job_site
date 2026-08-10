"use client";
import React, { useRef, useState } from "react";

type Props = {
  src?: string | null;
  name?: string;
  size?: "md" | "lg" | "xl";
  editable?: boolean;
  uploading?: boolean;
  onFileSelect?: (file: File) => void | Promise<void>;
  rounded?: "circle" | "tile";
  hint?: string;
};

export default function ProfileAvatar({
  src,
  name = "",
  size = "lg",
  editable = false,
  uploading = false,
  onFileSelect,
  rounded = "circle",
  hint,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const display = preview || src || "";
  const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";

  const pick = () => {
    if (!editable || uploading) return;
    inputRef.current?.click();
  };

  const body = (
    <>
      {display ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={display} alt={name || "Profile"} />
      ) : (
        <span className="fallback">
          {rounded === "circle" ? <i className="bi bi-person" /> : initial}
        </span>
      )}
      {uploading && (
        <span className="overlay" role="status" aria-label="Uploading">
          <span className="signet-upload-shimmer" />
          <span className="signet-spinner sm" style={{ position: "relative", zIndex: 1, borderColor: "rgba(255,255,255,.35)", borderTopColor: "#fff" }} />
        </span>
      )}
      {editable && !uploading && (
        <span className="edit-badge" aria-hidden>
          <i className="bi bi-camera-fill" />
        </span>
      )}
    </>
  );

  return (
    <div className={`signet-avatar-wrap size-${size}`}>
      {editable ? (
        <button
          type="button"
          className={`signet-avatar ${rounded} editable`}
          onClick={pick}
          aria-label="Change photo"
        >
          {body}
        </button>
      ) : (
        <span className={`signet-avatar ${rounded}`} aria-label="Profile photo">
          {body}
        </span>
      )}
      {hint && <p className="signet-avatar-hint">{hint}</p>}
      {editable && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file || !onFileSelect) return;
            setPreview(URL.createObjectURL(file));
            await onFileSelect(file);
          }}
        />
      )}
    </div>
  );
}
