"use client";
import { store } from "./store";
import { Provider } from "react-redux";
import { AuthProvider } from "@/context/auth-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
      <Provider store={store}>
        <AuthProvider>{children}</AuthProvider>
      </Provider>
  );
}
