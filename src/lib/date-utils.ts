export function parseFirestoreTimestamp(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "number") {
    const ms = value < 1e12 ? value * 1000 : value;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const anyVal = value as {
    toDate?: () => Date;
    seconds?: number;
    _seconds?: number;
  };
  if (typeof anyVal.toDate === "function") {
    try {
      const date = anyVal.toDate();
      return Number.isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }
  const seconds = anyVal.seconds ?? anyVal._seconds;
  if (typeof seconds === "number") {
    const date = new Date(seconds * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

export function timestampToMillis(value: unknown): number {
  const date = parseFirestoreTimestamp(value);
  return date ? date.getTime() : 0;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function formatChatDateLabel(date: Date, now = new Date()): string {
  const diffDays = Math.floor(
    (startOfDay(now).getTime() - startOfDay(date).getTime()) / 86400000
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return date.toLocaleDateString(undefined, { weekday: "long" });
  }
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

export function formatChatListTime(value: unknown, now = new Date()): string {
  const date = parseFirestoreTimestamp(value);
  if (!date) return "";
  const diffDays = Math.floor(
    (startOfDay(now).getTime() - startOfDay(date).getTime()) / 86400000
  );
  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return date.toLocaleDateString(undefined, { weekday: "short" });
  }
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

export function formatChatMessageTime(value: unknown): string {
  const date = parseFirestoreTimestamp(value);
  if (!date) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
