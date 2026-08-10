import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase";

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
  const ext = extFromFile(file, "jpg");
  const storageRef = ref(storage, `profile_images/${uid}.${ext}`);
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
