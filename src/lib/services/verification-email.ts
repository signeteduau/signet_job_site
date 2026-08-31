import { getFunctions, httpsCallable } from "firebase/functions";
import app from "@/lib/firebase";

export async function requestVerificationEmail(): Promise<void> {
  const functions = getFunctions(app, "us-central1");
  const send = httpsCallable(functions, "sendVerificationEmail");
  await send();
}
