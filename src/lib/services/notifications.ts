import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  Unsubscribe,
  DocumentData,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppNotification } from "@/types/chat";

function mapNotif(id: string, data: DocumentData): AppNotification {
  return {
    id,
    title: data.title || "",
    body: data.body || "",
    type: data.type || "",
    data: data.data || {},
    logoUrl: data.logoUrl || "",
    read: !!data.read,
    createdAt: data.createdAt,
  };
}

export async function fetchNotifications(uid: string): Promise<AppNotification[]> {
  try {
    const q = query(
      collection(db, "users", uid, "notifications"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapNotif(d.id, d.data()));
  } catch {
    const snap = await getDocs(collection(db, "users", uid, "notifications"));
    return snap.docs.map((d) => mapNotif(d.id, d.data()));
  }
}

export function subscribeToNotifications(
  uid: string,
  cb: (items: AppNotification[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "users", uid, "notifications"),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => mapNotif(d.id, d.data()))),
    async () => {
      cb(await fetchNotifications(uid));
    }
  );
}

export async function markNotificationRead(
  uid: string,
  id: string
): Promise<void> {
  await updateDoc(doc(db, "users", uid, "notifications", id), { read: true });
}

export async function markAllNotificationsRead(uid: string): Promise<void> {
  const items = await fetchNotifications(uid);
  await Promise.all(
    items.filter((n) => !n.read).map((n) => markNotificationRead(uid, n.id))
  );
}
