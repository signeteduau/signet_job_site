"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  markChatRead,
  sendMessage,
  setTyping,
  subscribeToMessages,
} from "@/lib/services/chat";
import { PageLoader } from "@/app/components/signet/shimmer";
import { ChatMessage, ChatThread } from "@/types/chat";

function formatMsgTime(ts: unknown) {
  const seconds = (ts as { seconds?: number })?.seconds;
  if (!seconds) return "";
  return new Date(seconds * 1000).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ChatDetail({
  chatId,
  uid,
  role,
}: {
  chatId: string;
  uid: string;
  role: "candidate" | "company";
}) {
  const isCompany = role === "company";
  const [chat, setChat] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    markChatRead({ chatId, isCompany });
    const unsubChat = onSnapshot(doc(db, "chats", chatId), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setChat({
        id: snap.id,
        chatId: data.chatId || snap.id,
        users: data.users || [],
        companyId: data.companyId || "",
        candidateId: data.candidateId || "",
        companyName: data.companyName || "Company",
        candidateName: data.candidateName || "Candidate",
        companyImage: data.companyImage || "",
        candidateImage: data.candidateImage || "",
        lastMessage: data.lastMessage || "",
        lastMessageTime: data.lastMessageTime,
        typingByCompany: !!data.typingByCompany,
        typingByCandidate: !!data.typingByCandidate,
        unreadByCompany: !!data.unreadByCompany,
        unreadByCandidate: !!data.unreadByCandidate,
      });
    });
    const unsub = subscribeToMessages(chatId, (list) => {
      setMessages(list);
      markChatRead({ chatId, isCompany });
    });
    return () => {
      unsubChat();
      unsub();
    };
  }, [chatId, isCompany]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!chat) {
    return (
      <PageLoader label="Loading chat…" />
    );
  }

  const title = isCompany ? chat.candidateName : chat.companyName;
  const image = isCompany ? chat.candidateImage : chat.companyImage;
  const receiverId = isCompany ? chat.candidateId : chat.companyId;
  const otherTyping = isCompany
    ? chat.typingByCandidate
    : chat.typingByCompany;
  const back = isCompany ? "/company/chat" : "/candidate/chat";

  const onType = (value: string) => {
    setText(value);
    setTyping({ chatId, isCompany, typing: true });
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setTyping({ chatId, isCompany, typing: false });
    }, 1500);
  };

  return (
    <div className="signet-chat-detail">
      <div className="signet-chat-header">
        <Link href={back} className="signet-ghost-btn">
          <i className="bi bi-arrow-left" />
        </Link>
        <div className="signet-logo-tile" style={{ width: 42, height: 42 }}>
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={title} />
          ) : (
            <span>{(title || "S").charAt(0)}</span>
          )}
        </div>
        <div>
          <strong>{title}</strong>
          {otherTyping && (
            <div style={{ fontSize: 12, color: "#004CF0" }}>Typing…</div>
          )}
        </div>
      </div>

      <div className="signet-chat-messages">
        {messages.map((m) => {
          const mine = m.senderId === uid;
          const deleted = isCompany
            ? m.isDeletedByCompany
            : m.isDeletedByCandidate;
          if (deleted) return null;
          return (
            <div
              key={m.id}
              className={`signet-bubble ${mine ? "mine" : "theirs"}`}
            >
              <div className="signet-bubble-text">{m.text}</div>
              <div className="signet-bubble-time">{formatMsgTime(m.timestamp)}</div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        className="signet-chat-composer"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!text.trim() || sending) return;
          setSending(true);
          try {
            await sendMessage({
              chatId,
              senderId: uid,
              receiverId,
              text,
              senderIsCompany: isCompany,
            });
            setText("");
            await setTyping({ chatId, isCompany, typing: false });
          } finally {
            setSending(false);
          }
        }}
      >
        <input
          value={text}
          onChange={(e) => onType(e.target.value)}
          placeholder="Type a message…"
        />
        <button className="signet-btn" type="submit" disabled={sending || !text.trim()}>
          <i className="bi bi-send-fill" />
        </button>
      </form>
    </div>
  );
}
