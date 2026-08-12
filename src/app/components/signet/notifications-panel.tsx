"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NotifListShimmer } from "@/app/components/signet/shimmer";
import {
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
} from "@/lib/services/notifications";
import { AppNotification } from "@/types/chat";

function resolveDeepLink(
  n: AppNotification,
  role: "candidate" | "company"
): string | null {
  const data = n.data || {};
  const type = (n.type || "").toLowerCase();
  const jobId = String(data.jobId || data.job_id || "");
  const chatId = String(data.chatId || data.chat_id || "");
  const companyId = String(data.companyId || data.company_id || "");
  const applicantId = String(data.applicantId || data.userId || data.user_id || "");

  if (chatId) {
    return role === "company"
      ? `/company/chat/${chatId}`
      : `/candidate/chat/${chatId}`;
  }
  if (type.includes("message") || type.includes("chat")) {
    return role === "company" ? "/company/chat" : "/candidate/chat";
  }
  if (jobId && role === "candidate") {
    return `/jobs/${jobId}`;
  }
  if (jobId && role === "company") {
    if (applicantId) {
      return `/company/applications/${jobId}/${applicantId}`;
    }
    return `/company/applications?jobId=${jobId}`;
  }
  if (companyId && role === "candidate") {
    return `/candidate/companies/${companyId}`;
  }
  if (type.includes("application") && role === "company") {
    return "/company/applications";
  }
  if (type.includes("application") && role === "candidate") {
    return "/candidate/my-jobs";
  }
  return null;
}

export default function NotificationsPanel({
  uid,
  role = "candidate",
}: {
  uid: string;
  role?: "candidate" | "company";
}) {
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToNotifications(uid, (list) => {
      setItems(list);
      setLoading(false);
    });
    return () => unsub();
  }, [uid]);

  if (loading) {
    return <NotifListShimmer count={6} />;
  }

  return (
    <>
      <div className="d-flex justify-content-end mb-3">
        <button
          className="signet-btn secondary"
          onClick={() => markAllNotificationsRead(uid)}
        >
          Mark all read
        </button>
      </div>
      {items.length === 0 && (
        <div className="signet-empty signet-panel">
          <h4>No notifications</h4>
          <p>Updates about jobs, applications, and messages will appear here.</p>
        </div>
      )}
      {items.map((n) => (
        <button
          key={n.id}
          type="button"
          className={`signet-notif-row w-100 text-start border-0 ${n.read ? "" : "unread"}`}
          onClick={async () => {
            await markNotificationRead(uid, n.id);
            const href = resolveDeepLink(n, role);
            if (href) router.push(href);
          }}
        >
          <div className="icon">
            <i className="bi bi-bell" />
          </div>
          <div>
            <strong style={{ color: "#12141A" }}>{n.title}</strong>
            <div style={{ color: "#6B7280", fontSize: 13 }}>{n.body}</div>
          </div>
        </button>
      ))}
    </>
  );
}
