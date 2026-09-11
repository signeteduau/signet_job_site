"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  initFirebaseAnalytics,
  logAnalyticsEvent,
  setAnalyticsUser,
} from "@/lib/analytics";

function FirebaseAnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, profile } = useAuth();

  useEffect(() => {
    initFirebaseAnalytics();
  }, []);

  useEffect(() => {
    if (!pathname) return;
    const query = searchParams?.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;
    logAnalyticsEvent("page_view", {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  useEffect(() => {
    if (user) {
      setAnalyticsUser(user.uid, {
        user_type: profile?.userType || "unknown",
      });
      return;
    }
    setAnalyticsUser(null);
  }, [user, profile?.userType]);

  return null;
}

export default function FirebaseAnalytics() {
  return (
    <Suspense fallback={null}>
      <FirebaseAnalyticsTracker />
    </Suspense>
  );
}
