import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppUser, CompanyConnection, CompanyConnectionStatus } from "@/types/firestore";

function mapConnection(
  id: string,
  data: Record<string, unknown>
): CompanyConnection {
  const headId = String(data.headId || "");
  const subId = String(data.subId || data.requesterId || "");
  return {
    id,
    requesterId: String(data.requesterId || subId),
    requesterName: String(data.requesterName || data.subName || ""),
    requesterLogo: String(data.requesterLogo || data.subLogo || ""),
    headId: headId || String(data.requesterId || ""),
    headName: String(data.headName || ""),
    headLogo: String(data.headLogo || ""),
    subId,
    subName: String(data.subName || data.requesterName || ""),
    subLogo: String(data.subLogo || data.requesterLogo || ""),
    status: (data.status as CompanyConnectionStatus) || "pending",
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

function connectionId(headId: string, subId: string) {
  return `${headId}_${subId}`;
}

export function subCompanyId(item: CompanyConnection) {
  return item.subId || "";
}

export function subCompanyName(item: CompanyConnection) {
  return item.subName || "Company";
}

export function subCompanyLogo(item: CompanyConnection) {
  return item.subLogo || "";
}

function mergeConnections(
  headItems: CompanyConnection[],
  subItems: CompanyConnection[]
) {
  const byId = new Map<string, CompanyConnection>();
  [...headItems, ...subItems].forEach((item) => byId.set(item.id, item));
  return Array.from(byId.values()).sort((a, b) => {
    const as = (a.createdAt as { seconds?: number })?.seconds || 0;
    const bs = (b.createdAt as { seconds?: number })?.seconds || 0;
    return bs - as;
  });
}

export async function fetchCompanyConnections(
  uid: string
): Promise<CompanyConnection[]> {
  const col = collection(db, "companyConnections");
  const [asHead, asSub] = await Promise.all([
    getDocs(query(col, where("headId", "==", uid))),
    getDocs(query(col, where("subId", "==", uid))),
  ]);
  return mergeConnections(
    asHead.docs.map((d) => mapConnection(d.id, d.data() as Record<string, unknown>)),
    asSub.docs.map((d) => mapConnection(d.id, d.data() as Record<string, unknown>))
  );
}

export function subscribeCompanyConnections(
  uid: string,
  cb: (items: CompanyConnection[]) => void
): Unsubscribe {
  const col = collection(db, "companyConnections");
  let headItems: CompanyConnection[] = [];
  let subItems: CompanyConnection[] = [];

  const emit = () => cb(mergeConnections(headItems, subItems));

  const unsubHead = onSnapshot(
    query(col, where("headId", "==", uid)),
    (snap) => {
      headItems = snap.docs.map((d) =>
        mapConnection(d.id, d.data() as Record<string, unknown>)
      );
      emit();
    },
    () => {
      fetchCompanyConnections(uid).then(cb).catch(() => cb([]));
    }
  );
  const unsubSub = onSnapshot(
    query(col, where("subId", "==", uid)),
    (snap) => {
      subItems = snap.docs.map((d) =>
        mapConnection(d.id, d.data() as Record<string, unknown>)
      );
      emit();
    },
    () => {
      fetchCompanyConnections(uid).then(cb).catch(() => cb([]));
    }
  );

  return () => {
    unsubHead();
    unsubSub();
  };
}

/** Parent sees requests from companies wanting to join as children. */
export function incomingPendingCount(items: CompanyConnection[], uid: string) {
  return items.filter(
    (item) => item.headId === uid && item.status === "pending"
  ).length;
}

/** Children of this parent company. */
export function acceptedSubs(
  items: CompanyConnection[],
  uid: string
): CompanyConnection[] {
  return items.filter(
    (item) => item.headId === uid && item.status === "accepted"
  );
}

/** Parent of this child company, if any. */
export function acceptedHead(
  items: CompanyConnection[],
  uid: string
): CompanyConnection | undefined {
  return items.find(
    (item) => item.subId === uid && item.status === "accepted"
  );
}

/**
 * Child company (requester) asks parent (invitee) to accept them as a child.
 * On accept: invitee = parent (head), requester = child (sub).
 */
export async function sendCompanyConnectionRequest(opts: {
  requester: AppUser;
  invitee: Pick<AppUser, "uid" | "companyName" | "fullName" | "logoUrl" | "profileImage">;
  existing?: CompanyConnection[];
}): Promise<void> {
  const subId = opts.requester.uid;
  const headId = opts.invitee.uid;
  if (!headId || !subId || headId === subId) {
    throw new Error("Invalid company");
  }

  const existing = opts.existing || [];
  const alreadyChild = existing.find(
    (item) => item.subId === subId && item.status === "accepted"
  );
  if (alreadyChild) {
    throw new Error("You are already connected to a parent company. Disconnect first.");
  }
  const pendingOut = existing.find(
    (item) => item.subId === subId && item.status === "pending"
  );
  if (pendingOut) {
    throw new Error("You already have a pending request. Cancel it first.");
  }

  const linked = existing.find(
    (item) =>
      (item.headId === headId && item.subId === subId) ||
      (item.headId === subId && item.subId === headId)
  );
  if (linked?.status === "pending") {
    throw new Error(
      linked.subId === subId
        ? "Request already sent."
        : "This company already sent you a request."
    );
  }
  if (linked?.status === "accepted") {
    throw new Error("You are already connected with this company.");
  }

  const subName =
    opts.requester.companyName || opts.requester.fullName || "Company";
  const subLogo =
    opts.requester.logoUrl || opts.requester.profileImage || "";
  const headName =
    opts.invitee.companyName || opts.invitee.fullName || "Company";
  const headLogo = opts.invitee.logoUrl || opts.invitee.profileImage || "";

  await setDoc(doc(db, "companyConnections", connectionId(headId, subId)), {
    requesterId: subId,
    requesterName: subName,
    requesterLogo: subLogo,
    headId,
    headName,
    headLogo,
    subId,
    subName,
    subLogo,
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function respondToCompanyConnection(
  id: string,
  status: "accepted" | "declined"
): Promise<void> {
  await updateDoc(doc(db, "companyConnections", id), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function cancelCompanyConnection(id: string): Promise<void> {
  await deleteDoc(doc(db, "companyConnections", id));
}

export async function disconnectCompanyConnection(id: string): Promise<void> {
  await deleteDoc(doc(db, "companyConnections", id));
}

export function connectionWithCompany(
  items: CompanyConnection[],
  uid: string,
  otherId: string
): CompanyConnection | undefined {
  return items.find(
    (item) =>
      (item.headId === uid && item.subId === otherId) ||
      (item.subId === uid && item.headId === otherId)
  );
}
