export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "dl"; items: [string, string][] };

export type LegalSubsection = {
  id: string;
  title: string;
  blocks: LegalBlock[];
};

export type LegalSection = {
  id: string;
  number: string;
  title: string;
  subsections: LegalSubsection[];
  blocks: LegalBlock[];
};

export type LegalEntity = {
  legalName: string;
  businessName: string;
  abn: string;
  address: string;
  website: string;
  privacyEmail: string;
  supportEmail: string;
  deleteAccountUrl: string;
};

export type LegalDocumentMeta = {
  title: string;
  product?: string;
  effectiveDate: string;
  version: string;
  entity: LegalEntity;
  notice?: string;
};

export type LegalDocument = {
  meta: LegalDocumentMeta;
  sections: LegalSection[];
};
