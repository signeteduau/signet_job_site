"use client";

import { useEffect, useState } from "react";
import { isManagementEmail, normalizeEmail } from "@/lib/management";
import {
  fetchManagementEmails,
  seedManagementSettingsIfMissing,
} from "@/lib/services/management";

export function useIsManagement(email?: string | null): {
  allowed: boolean;
  loading: boolean;
} {
  const fallback = isManagementEmail(email);
  const [allowed, setAllowed] = useState(fallback);
  const [loading, setLoading] = useState(!fallback);

  useEffect(() => {
    const value = normalizeEmail(email);
    if (!value) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    const local = isManagementEmail(value);
    setAllowed(local);
    setLoading(!local);

    let alive = true;
    (async () => {
      if (local) await seedManagementSettingsIfMissing();
      const emails = await fetchManagementEmails();
      if (!alive) return;
      setAllowed(local || emails.includes(value));
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [email]);

  return { allowed, loading };
}
