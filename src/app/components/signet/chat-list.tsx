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
      <div className="signet-chat-empty signet-panel">
        <span className="signet-chat-empty-icon" aria-hidden>
          <i className="bi bi-chat-square-text" />
        </span>
        <h4>No conversations yet</h4>
        <p>
          {role === "company"
            ? "Message an applicant from their application to get started."
            : "Reach out to a company from a job or company page."}
        </p>
      </div>
    );
  }

  return (
    <div className="signet-chat-inbox">
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
              <span className="signet-chat-avatar">
                <span className="signet-logo-tile">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt={title} />
                  ) : (
                    <span>{(title || "S").charAt(0)}</span>
                  )}
                </span>
                {unread && <span className="signet-chat-unread-dot" aria-hidden />}
              </span>
              <span className="signet-chat-row-body">
                <span className="signet-chat-row-top">
                  <span className="signet-chat-row-name">{title}</span>
                  <span className="signet-chat-time">
                    {formatChatListTime(chat.lastMessageTime)}
                  </span>
                </span>
                <span
                  className={`signet-chat-preview ${typing ? "is-typing" : ""}`}
                >
                  {typing ? (
                    <>
                      <i className="bi bi-three-dots" aria-hidden />
                      Typing…
                    </>
                  ) : (
                    chat.lastMessage || "No messages yet"
                  )}
                </span>
              </span>
              <i className="bi bi-chevron-right signet-chat-row-chevron" aria-hidden />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
