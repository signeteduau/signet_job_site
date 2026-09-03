export type ActingCompany = {
  id: string;
  name: string;
  logo: string;
};

const KEY = "signet.actingCompany";
export const ACTING_COMPANY_EVENT = "signet-acting-company";

function sameActing(
  a: ActingCompany | null,
  b: ActingCompany | null
): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.id === b.id && a.name === b.name && a.logo === b.logo;
}

export function readActingCompany(): ActingCompany | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActingCompany;
    if (!parsed?.id) return null;
    return {
      id: String(parsed.id),
      name: String(parsed.name || "Company"),
      logo: String(parsed.logo || ""),
    };
  } catch {
    return null;
  }
}

export function writeActingCompany(company: ActingCompany | null) {
  if (typeof window === "undefined") return;
  if (sameActing(readActingCompany(), company)) return;
  if (!company) sessionStorage.removeItem(KEY);
  else sessionStorage.setItem(KEY, JSON.stringify(company));
  window.dispatchEvent(new Event(ACTING_COMPANY_EVENT));
}

export function clearActingParam() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has("as")) return;
  url.searchParams.delete("as");
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(window.history.state, "", next);
}

export function withActingParam(href: string, acting: ActingCompany | null) {
  if (!acting) return href;
  const [path, hash] = href.split("#");
  const sep = path.includes("?") ? "&" : "?";
  const next = `${path}${sep}as=${encodeURIComponent(acting.id)}`;
  return hash ? `${next}#${hash}` : next;
}

export function actingIdFromLocation() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("as") || "";
}
