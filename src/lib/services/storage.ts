import { FirebaseError } from "firebase/app";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase";

/** Profile uploads must use profile_images/{uid}.jpg — Firebase Storage rules match the mobile app. */
const PROFILE_IMAGE_PATH = (uid: string) => `profile_images/${uid}.jpg`;

export function getStorageErrorMessage(err: unknown): string {
  const code = err instanceof FirebaseError ? err.code : "";
  switch (code) {
    case "storage/unauthorized":
      return "Upload not allowed. Sign in again, or ask admin to check Firebase Storage rules.";
    case "storage/canceled":
      return "Upload was cancelled.";
    case "storage/quota-exceeded":
      return "Storage quota exceeded.";
    case "storage/unauthenticated":
      return "You must be signed in to upload files.";
    default:
      return code ? `Upload failed (${code}).` : "Upload failed.";
  }
}

function extFromFile(file: File, fallback: string) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  if (file.type.includes("png")) return "png";
  if (file.type.includes("webp")) return "webp";
  if (file.type.includes("jpeg") || file.type.includes("jpg")) return "jpg";
  if (file.type.includes("pdf")) return "pdf";
  return fallback;
}

export async function uploadProfileImage(
  uid: string,
  file: File
): Promise<string> {
  const storageRef = ref(storage, PROFILE_IMAGE_PATH(uid));
  await uploadBytes(storageRef, file, {
    contentType: file.type || "image/jpeg",
  });
  return getDownloadURL(storageRef);
}

export async function uploadResume(
  uid: string,
  jobId: string,
  file: File
): Promise<{ url: string; fileName: string }> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `resumes/${uid}/${jobId}_${Date.now()}_${safeName}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, {
    contentType: file.type || "application/pdf",
  });
  const url = await getDownloadURL(storageRef);
  return { url, fileName: file.name };
}

/** Persist a candidate's default resume on their profile. */
export async function uploadProfileResume(
  uid: string,
  file: File
): Promise<{ url: string; fileName: string }> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `resumes/${uid}/profile_${Date.now()}_${safeName}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, {
    contentType: file.type || "application/pdf",
  });
  const url = await getDownloadURL(storageRef);
  return { url, fileName: file.name };
}

export async function uploadJobAttachment(
  companyId: string,
  jobId: string,
  file: File
): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `job_attachments/${companyId}/${jobId}_${Date.now()}_${safeName}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, {
    contentType: file.type || "application/octet-stream",
  });
  return getDownloadURL(storageRef);
}
