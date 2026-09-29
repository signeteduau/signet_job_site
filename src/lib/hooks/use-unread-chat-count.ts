"use client";

import { useEffect, useState } from "react";
import { subscribeToChats, totalUnreadMessages } from "@/lib/services/chat";

export function useUnreadChatCount(
  uid: string | undefined,
  isCompany: boolean
): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!uid) {
      setCount(0);
      return;
    }
    return subscribeToChats(uid, (chats) => {
      setCount(totalUnreadMessages(chats, isCompany));
    });
  }, [uid, isCompany]);

  return count;
}
