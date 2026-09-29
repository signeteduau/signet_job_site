export const DEFAULT_MANAGEMENT_MEMBERS = [
  { name: "Pushpinder Singh", email: "pushpinder@signet.edu.au" },
  { name: "MAC", email: "mac@signet.edu.au" },
  { name: "Justin", email: "justin.f@signet.edu.au" },
  { name: "Ali", email: "salesmanager@signet.edu.au" },
  { name: "Dr. Christine Walela", email: "christine.w@signet.edu.au" },
  { name: "Navdeep Kaur Roopan", email: "navdeep.k@signet.edu.au" },
  { name: "Mai", email: "mai.n@signet.edu.au" },
] as const;

export const DEFAULT_MANAGEMENT_EMAILS = DEFAULT_MANAGEMENT_MEMBERS.map(
  (member) => member.email
);

export function normalizeEmail(email?: string | null): string {
  return (email || "").trim().toLowerCase();
}

export function isManagementEmail(email?: string | null): boolean {
  return DEFAULT_MANAGEMENT_EMAILS.includes(normalizeEmail(email));
}
