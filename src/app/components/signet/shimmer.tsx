"use client";
import React from "react";

export function ShimmerBlock({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <span className={`signet-shimmer ${className}`} style={style} aria-hidden />;
}

export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="signet-loading" role="status" aria-live="polite">
      <div className="signet-spinner" />
      <p>{label}</p>
    </div>
  );
}

export function JobCardShimmer() {
  return (
    <div className="signet-job-card signet-job-card--skeleton" aria-hidden>
      <div className="signet-job-card-inner">
        <div className="signet-job-row">
          <ShimmerBlock className="sk-logo" style={{ width: 48, height: 48, borderRadius: 10 }} />
          <div className="signet-job-body flex-grow-1">
            <div className="d-flex gap-2 mb-2">
              <ShimmerBlock className="sk-chip" style={{ width: 56, height: 20, borderRadius: 999 }} />
              <ShimmerBlock className="sk-chip" style={{ width: 36, height: 20, borderRadius: 999 }} />
            </div>
            <ShimmerBlock className="sk-line sk-w-70" style={{ height: 18 }} />
            <ShimmerBlock className="sk-line sk-w-90 mt-2" style={{ height: 14 }} />
            <div className="d-flex justify-content-between align-items-center mt-3 pt-3">
              <ShimmerBlock className="sk-line sk-w-30" style={{ height: 14 }} />
              <ShimmerBlock className="sk-chip" style={{ width: 88, height: 34, borderRadius: 8 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function JobListShimmer({ count = 4 }: { count?: number }) {
  return (
    <div className="signet-shimmer-list" aria-busy="true" aria-label="Loading jobs">
      {Array.from({ length: count }).map((_, i) => (
        <JobCardShimmer key={i} />
      ))}
    </div>
  );
}

export function PanelShimmer({ rows = 4 }: { rows?: number }) {
  return (
    <div className="signet-panel" aria-busy="true">
      <ShimmerBlock className="sk-line sk-w-40 mb-3" style={{ height: 22 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <ShimmerBlock
          key={i}
          className={`sk-line mb-2 ${i % 2 ? "sk-w-70" : "sk-w-90"}`}
        />
      ))}
    </div>
  );
}

export function NotifListShimmer({ count = 5 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading notifications">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="signet-notif-row">
          <ShimmerBlock className="sk-icon" />
          <div className="flex-grow-1">
            <ShimmerBlock className="sk-line sk-w-50" />
            <ShimmerBlock className="sk-line sk-w-80 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatListShimmer({ count = 5 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading chats">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="signet-chat-row">
          <ShimmerBlock className="sk-logo" style={{ width: 48, height: 48 }} />
          <div className="flex-grow-1">
            <ShimmerBlock className="sk-line sk-w-40" />
            <ShimmerBlock className="sk-line sk-w-70 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

type FileUploadFieldProps = {
  label: string;
  accept?: string;
  hint?: string;
  uploading?: boolean;
  uploadLabel?: string;
  currentLabel?: React.ReactNode | null;
  disabled?: boolean;
  onFile: (file: File) => void | Promise<void>;
};

/** File input with shimmer/progress overlay while uploading. */
export function FileUploadField({
  label,
  accept,
  hint,
  uploading = false,
  uploadLabel = "Uploading…",
  currentLabel,
  disabled,
  onFile,
}: FileUploadFieldProps) {
  return (
    <div className={`signet-field signet-upload-field ${uploading ? "is-uploading" : ""}`}>
      <label>{label}</label>
      {currentLabel && <div className="signet-upload-current">{currentLabel}</div>}
      <div className="signet-upload-box">
        {uploading && (
          <div className="signet-upload-overlay" role="status" aria-live="polite">
            <div className="signet-upload-shimmer" />
            <div className="signet-upload-status">
              <span className="signet-spinner sm" />
              <span>{uploadLabel}</span>
            </div>
          </div>
        )}
        <input
          type="file"
          accept={accept}
          disabled={disabled || uploading}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            await onFile(file);
          }}
        />
      </div>
      {hint && !uploading && (
        <small style={{ color: "#6B7280" }}>{hint}</small>
      )}
    </div>
  );
}
