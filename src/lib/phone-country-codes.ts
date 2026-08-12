export const DEFAULT_PHONE_COUNTRY_CODE = "+61";

export const PHONE_COUNTRY_CODES = [
  { code: "+61", label: "AU +61" },
  { code: "+91", label: "IN +91" },
  { code: "+1", label: "US +1" },
  { code: "+44", label: "UK +44" },
  { code: "+971", label: "AE +971" },
  { code: "+65", label: "SG +65" },
  { code: "+49", label: "DE +49" },
  { code: "+33", label: "FR +33" },
  { code: "+81", label: "JP +81" },
  { code: "+86", label: "CN +86" },
  { code: "+92", label: "PK +92" },
  { code: "+880", label: "BD +880" },
  { code: "+94", label: "LK +94" },
  { code: "+977", label: "NP +977" },
  { code: "+974", label: "QA +974" },
  { code: "+966", label: "SA +966" },
  { code: "+27", label: "ZA +27" },
  { code: "+55", label: "BR +55" },
  { code: "+52", label: "MX +52" },
  { code: "+39", label: "IT +39" },
  { code: "+34", label: "ES +34" },
  { code: "+31", label: "NL +31" },
  { code: "+46", label: "SE +46" },
  { code: "+47", label: "NO +47" },
  { code: "+48", label: "PL +48" },
] as const;

export function formatFullPhone(
  countryCode?: string,
  phone?: string
): string {
  const local = (phone || "").trim();
  if (!local) return "";
  const code = (countryCode || DEFAULT_PHONE_COUNTRY_CODE).trim();
  return `${code} ${local}`;
}
