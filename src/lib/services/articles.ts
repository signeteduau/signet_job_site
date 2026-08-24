import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { normalizeArticleImage } from "@/lib/article-utils";
import { Article } from "@/types/chat";

function mapArticle(id: string, data: DocumentData): Article {
  return {
    id,
    title: data.title || "",
    subtitle: data.subtitle || "",
    image: normalizeArticleImage(data.image || data.imageUrl || ""),
    author: data.author || "",
    tags: data.tags || [],
    featured: !!data.featured,
    content:
      data.content ||
      data.contentHtml ||
      data.html ||
      data.body ||
      "",
    createdAt: data.createdAt,
  };
}

export async function fetchArticles(max = 40): Promise<Article[]> {
  try {
    const q = query(
      collection(db, "articles"),
      orderBy("createdAt", "desc"),
      limit(max)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapArticle(d.id, d.data()));
  } catch {
    try {
      const snap = await getDocs(collection(db, "articles"));
      return snap.docs.map((d) => mapArticle(d.id, d.data()));
    } catch {
      return [];
    }
  }
}

export async function fetchArticleById(id: string): Promise<Article | null> {
  try {
    const snap = await getDoc(doc(db, "articles", id));
    if (snap.exists()) return mapArticle(snap.id, snap.data());
  } catch {
    // Firestore unavailable or rules block access.
  }
  return null;
}

export async function searchArticles(opts?: {
  tag?: string;
  term?: string;
  max?: number;
}): Promise<Article[]> {
  const articles = await fetchArticles(opts?.max ?? 40);
  const tag = (opts?.tag || "").trim().toLowerCase();
  const term = (opts?.term || "").trim().toLowerCase();

  return articles.filter((article) => {
    if (tag && !(article.tags || []).some((t) => t.toLowerCase() === tag)) {
      return false;
    }
    if (!term) return true;
    const hay = [
      article.title,
      article.subtitle,
      article.author,
      (article.tags || []).join(" "),
      article.content,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(term);
  });
}
