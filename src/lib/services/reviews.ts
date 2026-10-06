import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type SiteReview = {
  id: string;
  quote: string;
  name: string;
  title: string;
  place: string;
  kind: "Candidate" | "Employer";
  accent: string;
  rating: number;
  order: number;
};

function mapReview(item: Record<string, unknown>, index: number): SiteReview | null {
  if (item.published === false) return null;
  const quote = String(item.quote || "").trim();
  const name = String(item.name || "").trim();
  if (!quote || !name) return null;
  const rating = Number(item.rating);
  return {
    id: String(item.id || `review-${index}`),
    quote,
    name,
    title: String(item.title || "").trim(),
    place: String(item.place || "").trim(),
    kind: item.kind === "Employer" ? "Employer" : "Candidate",
    accent: String(item.accent || "#2550eb"),
    rating: Number.isFinite(rating) ? Math.min(5, Math.max(1, rating)) : 5,
    order: Number(item.order) || index + 1,
  };
}

export async function fetchPublishedReviews(): Promise<SiteReview[]> {
  try {
    const snap = await getDoc(doc(db, "legal", "homepageReviews"));
    const items = snap.exists() && Array.isArray(snap.data().items) ? snap.data().items : [];
    return items
      .map((item, index) => mapReview((item || {}) as Record<string, unknown>, index))
      .filter((item): item is SiteReview => Boolean(item))
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}
