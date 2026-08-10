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
import { Article } from "@/types/chat";

function mapArticle(id: string, data: DocumentData): Article {
  return {
    id,
    title: data.title || "",
    subtitle: data.subtitle || "",
    image: data.image || "",
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
    return snap.docs.map((d) => mapArticle(d.id, d.data()));
  } catch {
    const snap = await getDocs(collection(db, "articles"));
    return snap.docs.map((d) => mapArticle(d.id, d.data()));
  }
}

export async function fetchArticleById(id: string): Promise<Article | null> {
  const snap = await getDoc(doc(db, "articles", id));
  if (!snap.exists()) return null;
  return mapArticle(snap.id, snap.data());
}
