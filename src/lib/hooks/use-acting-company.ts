"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  ACTING_COMPANY_EVENT,
  ActingCompany,
  actingIdFromLocation,
  clearActingParam,
  readActingCompany,
  writeActingCompany,
} from "@/lib/acting-company";
import {
  acceptedSubs,
  subscribeCompanyConnections,
  subCompanyId,
  subCompanyLogo,
  subCompanyName,
} from "@/lib/services/company-connections";
import { CompanyConnection } from "@/types/firestore";

function toActing(item: CompanyConnection): ActingCompany {
  return {
    id: subCompanyId(item),
    name: subCompanyName(item),
    logo: subCompanyLogo(item),
  };
}

export function useActingCompany() {
  const { user, profile } = useAuth();
  const [children, setChildren] = useState<CompanyConnection[]>([]);
  const [ready, setReady] = useState(false);
  const [acting, setActingState] = useState<ActingCompany | null>(null);

  useEffect(() => {
    if (!user) return;
    return subscribeCompanyConnections(user.uid, (items) => {
      setChildren(acceptedSubs(items, user.uid));
      setReady(true);
    });
  }, [user]);

  useEffect(() => {
    if (!ready) {
      setActingState(readActingCompany());
      return;
    }
    const allowed = new Map(
      children.map((item) => [subCompanyId(item), toActing(item)])
    );
    const apply = () => {
      const stored = readActingCompany();
      const fromUrl = actingIdFromLocation();
      if (!stored && fromUrl) {
        const seeded = allowed.get(fromUrl);
        if (seeded) {
          writeActingCompany(seeded);
          setActingState(seeded);
          return;
        }
      }
      const next = stored ? allowed.get(stored.id) || null : null;
      if (stored && !next) {
        writeActingCompany(null);
        clearActingParam();
      }
      setActingState((prev) =>
        prev?.id === next?.id && prev?.name === next?.name ? prev : next
      );
    };
    apply();
    window.addEventListener(ACTING_COMPANY_EVENT, apply);
    window.addEventListener("popstate", apply);
    return () => {
      window.removeEventListener(ACTING_COMPANY_EVENT, apply);
      window.removeEventListener("popstate", apply);
    };
  }, [children, ready]);

  const setActing = (company: ActingCompany | null) => {
    writeActingCompany(company);
    if (!company) clearActingParam();
    setActingState(company);
  };

  const companyId = acting?.id || user?.uid || "";
  const companyName =
    acting?.name || profile?.companyName || profile?.fullName || "Company";
  const companyLogo =
    acting?.logo || profile?.logoUrl || profile?.profileImage || "";

  const actingProfile = useMemo(() => {
    if (!profile || !user) return profile;
    if (!acting) return { ...profile, uid: user.uid };
    return {
      ...profile,
      uid: acting.id,
      companyName: acting.name,
      logoUrl: acting.logo || profile.logoUrl,
    };
  }, [acting, profile, user]);

  return {
    acting,
    setActing,
    children,
    companyId,
    companyName,
    companyLogo,
    actingProfile,
    isActing: Boolean(acting),
  };
}
