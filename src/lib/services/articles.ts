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
import {
  FALLBACK_CAREER_ARTICLES,
  getFallbackArticleById,
} from "@/content/career-tips/fallback-articles";

function mapArticle(id: string, data: DocumentData): Article {
  return {
    id,
    title: data.title || "",
    subtitle: data.subtitle || "",
    image: normalizeArticleImage(data.image || data.imageUrl || ""),
    author: data.author || "",
    tags: data.tags || [],
    featured: !!data.featured,
    content: data.content || "",
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
    const list = snap.docs.map((d) => mapArticle(d.id, d.data()));
    return list.length ? list : FALLBACK_CAREER_ARTICLES.slice(0, max);
  } catch {
    try {
      const snap = await getDocs(collection(db, "articles"));
      const list = snap.docs.map((d) => mapArticle(d.id, d.data()));
      return list.length ? list : FALLBACK_CAREER_ARTICLES.slice(0, max);
    } catch {
      return FALLBACK_CAREER_ARTICLES.slice(0, max);
    }
  }
}

export async function fetchArticleById(id: string): Promise<Article | null> {
  try {
    const snap = await getDoc(doc(db, "articles", id));
    if (snap.exists()) return mapArticle(snap.id, snap.data());
  } catch {
    // Fall through to bundled content for demo / when rules block guests.
  }
  return getFallbackArticleById(id);
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
