export type ChatThread = {
  id: string;
  chatId: string;
  users: string[];
  companyId: string;
  candidateId: string;
  companyName: string;
  candidateName: string;
  companyImage?: string;
  candidateImage?: string;
  lastMessage?: string;
  lastMessageTime?: unknown;
  typingByCompany?: boolean;
  typingByCandidate?: boolean;
  unreadByCompany?: boolean;
  unreadByCandidate?: boolean;
  archivedByCompany?: boolean;
  archivedByCandidate?: boolean;
  deletedByCompany?: boolean;
  deletedByCandidate?: boolean;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp?: unknown;
  isEdited?: boolean;
  isDeletedByCandidate?: boolean;
  isDeletedByCompany?: boolean;
  isReadByCandidate?: boolean;
  isReadByCompany?: boolean;
};

export type Article = {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  author?: string;
  tags?: string[];
  featured?: boolean;
  content?: string;
  createdAt?: unknown;
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  type?: string;
  data?: Record<string, unknown>;
  logoUrl?: string;
  read?: boolean;
  createdAt?: unknown;
};
