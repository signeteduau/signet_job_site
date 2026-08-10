import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  Unsubscribe,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ChatMessage, ChatThread } from "@/types/chat";
import { AppUser } from "@/types/firestore";

function mapChat(id: string, data: DocumentData): ChatThread {
  return {
    id,
    chatId: data.chatId || id,
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
    archivedByCompany: !!data.archivedByCompany,
    archivedByCandidate: !!data.archivedByCandidate,
    deletedByCompany: !!data.deletedByCompany,
    deletedByCandidate: !!data.deletedByCandidate,
  };
}

function mapMessage(id: string, data: DocumentData): ChatMessage {
  return {
    id,
    senderId: data.senderId || "",
    receiverId: data.receiverId || "",
    text: data.text || "",
    timestamp: data.timestamp,
    isEdited: !!data.isEdited,
    isDeletedByCandidate: !!data.isDeletedByCandidate,
    isDeletedByCompany: !!data.isDeletedByCompany,
    isReadByCandidate: !!data.isReadByCandidate,
    isReadByCompany: !!data.isReadByCompany,
  };
}

export function chatIdFor(uidA: string, uidB: string) {
  return [uidA, uidB].sort().join("_");
}

export async function openOrCreateChat(opts: {
  currentUser: AppUser;
  otherUserId: string;
}): Promise<string> {
  const { currentUser, otherUserId } = opts;
  const otherSnap = await getDoc(doc(db, "users", otherUserId));
  if (!otherSnap.exists()) throw new Error("User not found");
  const other = { uid: otherUserId, ...(otherSnap.data() as Omit<AppUser, "uid">) };

  const isCompany = currentUser.userType === "company";
  const companyId = isCompany ? currentUser.uid : otherUserId;
  const candidateId = isCompany ? otherUserId : currentUser.uid;
  const company = isCompany ? currentUser : other;
  const candidate = isCompany ? other : currentUser;

  const chatId = chatIdFor(currentUser.uid, otherUserId);
  const chatRef = doc(db, "chats", chatId);
  const existing = await getDoc(chatRef);

  if (!existing.exists()) {
    await setDoc(chatRef, {
      chatId,
      users: [currentUser.uid, otherUserId],
      companyId,
      candidateId,
      companyName: company.companyName || company.fullName || "Company",
      candidateName: candidate.fullName || "Candidate",
      companyImage: company.logoUrl || company.profileImage || "",
      candidateImage: candidate.profileImage || "",
      lastMessage: "",
      lastMessageTime: serverTimestamp(),
      typingByCompany: false,
      typingByCandidate: false,
      unreadByCompany: false,
      unreadByCandidate: false,
      archivedByCompany: false,
      archivedByCandidate: false,
      deletedByCompany: false,
      deletedByCandidate: false,
    });
  } else {
    await setDoc(
      chatRef,
      isCompany ? { deletedByCompany: false } : { deletedByCandidate: false },
      { merge: true }
    );
  }

  return chatId;
}

export async function fetchUserChats(uid: string): Promise<ChatThread[]> {
  const q = query(
    collection(db, "chats"),
    where("users", "array-contains", uid),
    orderBy("lastMessageTime", "desc")
  );
  try {
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => mapChat(d.id, d.data()))
      .filter((c) => {
        const isCompany = c.companyId === uid;
        return isCompany ? !c.deletedByCompany : !c.deletedByCandidate;
      });
  } catch {
    // Fallback if composite index missing
    const q2 = query(
      collection(db, "chats"),
      where("users", "array-contains", uid)
    );
    const snap = await getDocs(q2);
    return snap.docs
      .map((d) => mapChat(d.id, d.data()))
      .filter((c) => {
        const isCompany = c.companyId === uid;
        return isCompany ? !c.deletedByCompany : !c.deletedByCandidate;
      })
      .sort((a, b) => {
        const ta = (a.lastMessageTime as { seconds?: number })?.seconds || 0;
        const tb = (b.lastMessageTime as { seconds?: number })?.seconds || 0;
        return tb - ta;
      });
  }
}

export function subscribeToChats(
  uid: string,
  cb: (chats: ChatThread[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "chats"),
    where("users", "array-contains", uid)
  );
  return onSnapshot(q, (snap) => {
    const list = snap.docs
      .map((d) => mapChat(d.id, d.data()))
      .filter((c) => {
        const isCompany = c.companyId === uid;
        return isCompany ? !c.deletedByCompany : !c.deletedByCandidate;
      })
      .sort((a, b) => {
        const ta = (a.lastMessageTime as { seconds?: number })?.seconds || 0;
        const tb = (b.lastMessageTime as { seconds?: number })?.seconds || 0;
        return tb - ta;
      });
    cb(list);
  });
}

export function subscribeToMessages(
  chatId: string,
  cb: (messages: ChatMessage[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("timestamp", "asc")
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => mapMessage(d.id, d.data())));
  });
}

export async function sendMessage(opts: {
  chatId: string;
  senderId: string;
  receiverId: string;
  text: string;
  senderIsCompany: boolean;
}): Promise<void> {
  const text = opts.text.trim();
  if (!text) return;

  await addDoc(collection(db, "chats", opts.chatId, "messages"), {
    senderId: opts.senderId,
    receiverId: opts.receiverId,
    text,
    timestamp: serverTimestamp(),
    isEdited: false,
    isDeletedByCandidate: false,
    isDeletedByCompany: false,
    isReadByCandidate: !opts.senderIsCompany,
    isReadByCompany: opts.senderIsCompany,
  });

  await setDoc(
    doc(db, "chats", opts.chatId),
    {
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
      unreadByCompany: !opts.senderIsCompany,
      unreadByCandidate: opts.senderIsCompany,
      typingByCompany: false,
      typingByCandidate: false,
    },
    { merge: true }
  );
}

export async function markChatRead(opts: {
  chatId: string;
  isCompany: boolean;
}): Promise<void> {
  await setDoc(
    doc(db, "chats", opts.chatId),
    opts.isCompany ? { unreadByCompany: false } : { unreadByCandidate: false },
    { merge: true }
  );
}

export async function setTyping(opts: {
  chatId: string;
  isCompany: boolean;
  typing: boolean;
}): Promise<void> {
  await setDoc(
    doc(db, "chats", opts.chatId),
    opts.isCompany
      ? { typingByCompany: opts.typing }
      : { typingByCandidate: opts.typing },
    { merge: true }
  );
}

export async function getChat(chatId: string): Promise<ChatThread | null> {
  const snap = await getDoc(doc(db, "chats", chatId));
  if (!snap.exists()) return null;
  return mapChat(snap.id, snap.data());
}

export async function archiveChat(
  chatId: string,
  isCompany: boolean
): Promise<void> {
  await updateDoc(doc(db, "chats", chatId), {
    ...(isCompany
      ? { archivedByCompany: true }
      : { archivedByCandidate: true }),
  });
}
