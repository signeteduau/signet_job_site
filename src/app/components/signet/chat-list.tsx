"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChatListShimmer } from "@/app/components/signet/shimmer";
import { subscribeToChats } from "@/lib/services/chat";
import { formatChatListTime } from "@/lib/date-utils";
import { ChatThread } from "@/types/chat";

export default function ChatList({
  uid,
  role,
}: {
  uid: string;
  role: "candidate" | "company";
}) {
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const base = role === "company" ? "/company/chat" : "/candidate/chat";

  useEffect(() => {
    const unsub = subscribeToChats(uid, (list) => {
      setChats(list);
      setLoading(false);
    });
    return () => unsub();
  }, [uid]);

  if (loading) {
    return <ChatListShimmer count={6} />;
  }

  if (chats.length === 0) {
    return (
      <div className="signet-empty signet-panel">
        <h4>No conversations yet</h4>
        <p>
          {role === "company"
            ? "Message an applicant from their application."
            : "Message a company from a job or company page."}
        </p>
      </div>
    );
  }

  return (
    <div className="signet-chat-list">
      {chats.map((chat) => {
        const title =
          role === "company" ? chat.candidateName : chat.companyName;
        const image =
          role === "company" ? chat.candidateImage : chat.companyImage;
        const unread =
          role === "company" ? chat.unreadByCompany : chat.unreadByCandidate;
        const typing =
          role === "company" ? chat.typingByCandidate : chat.typingByCompany;
        return (
          <Link
            key={chat.id}
            href={`${base}/${chat.id}`}
            className={`signet-chat-row ${unread ? "unread" : ""}`}
          >
            <div className="signet-logo-tile">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt={title} />
              ) : (
                <span>{(title || "S").charAt(0)}</span>
              )}
            </div>
            <div className="flex-grow-1" style={{ minWidth: 0 }}>
              <div className="d-flex justify-content-between gap-2">
                <strong>{title}</strong>
                <span className="signet-chat-time">
                  {formatChatListTime(chat.lastMessageTime)}
                </span>
              </div>
              <div className="signet-chat-preview">
                {typing ? "Typing…" : chat.lastMessage || "No messages yet"}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
