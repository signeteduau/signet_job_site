"use client";
import { store } from "./store";
import { Provider } from "react-redux";
import { AuthProvider } from "@/context/auth-context";
import FirebaseAnalytics from "@/app/components/signet/firebase-analytics";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthProvider>
        <FirebaseAnalytics />
        {children}
      </AuthProvider>
    </Provider>
  );
}
