export type AddressValue = {
  street?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
};

export const ADDRESS_COUNTRIES = [
  "Australia",
  "India",
  "New Zealand",
  "United Kingdom",
  "United States",
  "United Arab Emirates",
  "Singapore",
  "Other",
] as const;

const AU_CITIES: Record<string, string[]> = {
  "New South Wales": ["Sydney", "Newcastle", "Wollongong", "Parramatta", "Central Coast"],
  Victoria: ["Melbourne", "Geelong", "Ballarat", "Bendigo", "Frankston"],
  Queensland: ["Brisbane", "Gold Coast", "Cairns", "Townsville", "Toowoomba"],
  "South Australia": ["Adelaide", "Magill", "Mount Gambier", "Whyalla", "Murray Bridge"],
  "Western Australia": ["Perth", "Fremantle", "Bunbury", "Geraldton", "Kalgoorlie"],
  Tasmania: ["Hobart", "Launceston", "Devonport", "Burnie"],
  "Northern Territory": ["Darwin", "Alice Springs", "Palmerston"],
  "Australian Capital Territory": ["Canberra", "Belconnen", "Woden"],
};

const IN_CITIES: Record<string, string[]> = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati"],
  "Arunachal Pradesh": ["Itanagar"],
  Assam: ["Guwahati", "Dibrugarh", "Silchar"],
  Bihar: ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur"],
  Chhattisgarh: ["Raipur", "Bhilai", "Bilaspur"],
  Goa: ["Panaji", "Margao"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
  Haryana: ["Gurugram", "Faridabad", "Panipat", "Karnal"],
  "Himachal Pradesh": ["Shimla", "Dharamshala"],
  Jharkhand: ["Ranchi", "Jamshedpur", "Dhanbad"],
  Karnataka: ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi"],
  Kerala: ["Thiruvananthapuram", "Kochi", "Kozhikode"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane"],
  Manipur: ["Imphal"],
  Meghalaya: ["Shillong"],
  Mizoram: ["Aizawl"],
  Nagaland: ["Kohima", "Dimapur"],
  Odisha: ["Bhubaneswar", "Cuttack", "Rourkela"],
  Punjab: ["Ludhiana", "Amritsar", "Jalandhar", "Mohali"],
  Rajasthan: ["Jaipur", "Jodhpur", "Udaipur", "Kota"],
  Sikkim: ["Gangtok"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli"],
  Telangana: ["Hyderabad", "Warangal", "Nizamabad"],
  Tripura: ["Agartala"],
  "Uttar Pradesh": ["Lucknow", "Noida", "Kanpur", "Varanasi", "Agra"],
  Uttarakhand: ["Dehradun", "Haridwar"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Siliguri"],
  Delhi: ["New Delhi", "Delhi"],
  "Jammu and Kashmir": ["Srinagar", "Jammu"],
  Ladakh: ["Leh"],
  Puducherry: ["Puducherry"],
  Chandigarh: ["Chandigarh"],
};

const NZ_CITIES: Record<string, string[]> = {
  Auckland: ["Auckland", "North Shore", "Manukau"],
  Wellington: ["Wellington", "Lower Hutt", "Porirua"],
  Canterbury: ["Christchurch", "Timaru"],
  Waikato: ["Hamilton", "Tauranga"],
  Otago: ["Dunedin", "Queenstown"],
};

const REGION_MAP: Record<string, Record<string, string[]>> = {
  Australia: AU_CITIES,
  India: IN_CITIES,
  "New Zealand": NZ_CITIES,
};

const POSTCODE_LOOKUP: Record<string, { city: string; state: string; country: string }> = {
  "2000": { city: "Sydney", state: "New South Wales", country: "Australia" },
  "2001": { city: "Sydney", state: "New South Wales", country: "Australia" },
  "2060": { city: "North Sydney", state: "New South Wales", country: "Australia" },
  "2500": { city: "Wollongong", state: "New South Wales", country: "Australia" },
  "2600": { city: "Canberra", state: "Australian Capital Territory", country: "Australia" },
  "2601": { city: "Canberra", state: "Australian Capital Territory", country: "Australia" },
  "3000": { city: "Melbourne", state: "Victoria", country: "Australia" },
  "3001": { city: "Melbourne", state: "Victoria", country: "Australia" },
  "4000": { city: "Brisbane", state: "Queensland", country: "Australia" },
  "4001": { city: "Brisbane", state: "Queensland", country: "Australia" },
  "4217": { city: "Gold Coast", state: "Queensland", country: "Australia" },
  "5000": { city: "Adelaide", state: "South Australia", country: "Australia" },
  "5001": { city: "Adelaide", state: "South Australia", country: "Australia" },
  "5072": { city: "Magill", state: "South Australia", country: "Australia" },
  "6000": { city: "Perth", state: "Western Australia", country: "Australia" },
  "6001": { city: "Perth", state: "Western Australia", country: "Australia" },
  "7000": { city: "Hobart", state: "Tasmania", country: "Australia" },
  "0800": { city: "Darwin", state: "Northern Territory", country: "Australia" },
  "110001": { city: "New Delhi", state: "Delhi", country: "India" },
  "110002": { city: "New Delhi", state: "Delhi", country: "India" },
  "400001": { city: "Mumbai", state: "Maharashtra", country: "India" },
  "400002": { city: "Mumbai", state: "Maharashtra", country: "India" },
  "411001": { city: "Pune", state: "Maharashtra", country: "India" },
  "560001": { city: "Bengaluru", state: "Karnataka", country: "India" },
  "600001": { city: "Chennai", state: "Tamil Nadu", country: "India" },
  "700001": { city: "Kolkata", state: "West Bengal", country: "India" },
  "500001": { city: "Hyderabad", state: "Telangana", country: "India" },
  "380001": { city: "Ahmedabad", state: "Gujarat", country: "India" },
  "302001": { city: "Jaipur", state: "Rajasthan", country: "India" },
  "226001": { city: "Lucknow", state: "Uttar Pradesh", country: "India" },
  "201301": { city: "Noida", state: "Uttar Pradesh", country: "India" },
  "122001": { city: "Gurugram", state: "Haryana", country: "India" },
};

function auStateFromPostcode(code: string): string | undefined {
  if (!/^\d{4}$/.test(code)) return undefined;
  const n = Number(code);
  if (n >= 800 && n <= 899) return "Northern Territory";
  if (n >= 200 && n <= 299) return "Australian Capital Territory";
  if ((n >= 2600 && n <= 2618) || (n >= 2900 && n <= 2920)) {
    return "Australian Capital Territory";
  }
  if (n >= 2000 && n <= 2999) return "New South Wales";
  if (n >= 3000 && n <= 3999) return "Victoria";
  if (n >= 4000 && n <= 4999) return "Queensland";
  if (n >= 5000 && n <= 5999) return "South Australia";
  if (n >= 6000 && n <= 6999) return "Western Australia";
  if (n >= 7000 && n <= 7999) return "Tasmania";
  return undefined;
}

function inStateFromPincode(code: string): string | undefined {
  if (!/^\d{6}$/.test(code)) return undefined;
  const prefix = Number(code.slice(0, 2));
  if (prefix === 11) return "Delhi";
  if (prefix >= 12 && prefix <= 13) return "Haryana";
  if (prefix >= 14 && prefix <= 16) return "Punjab";
  if (prefix === 17) return "Himachal Pradesh";
  if (prefix >= 18 && prefix <= 19) return "Jammu and Kashmir";
  if (prefix >= 20 && prefix <= 28) return "Uttar Pradesh";
  if (prefix >= 30 && prefix <= 34) return "Rajasthan";
  if (prefix >= 36 && prefix <= 39) return "Gujarat";
  if (prefix >= 40 && prefix <= 44) return "Maharashtra";
  if (prefix >= 45 && prefix <= 48) return "Madhya Pradesh";
  if (prefix === 49) return "Chhattisgarh";
  if (prefix === 50) return "Telangana";
  if (prefix >= 51 && prefix <= 53) return "Andhra Pradesh";
  if (prefix >= 56 && prefix <= 59) return "Karnataka";
  if (prefix >= 60 && prefix <= 64) return "Tamil Nadu";
  if (prefix >= 67 && prefix <= 69) return "Kerala";
  if (prefix >= 70 && prefix <= 74) return "West Bengal";
  if (prefix >= 75 && prefix <= 77) return "Odisha";
  if (prefix === 78) return "Assam";
  if (prefix === 79) return "Meghalaya";
  if (prefix >= 80 && prefix <= 85) return "Bihar";
  return undefined;
}

export function statesForCountry(country?: string): string[] {
  const map = REGION_MAP[country || ""];
  return map ? Object.keys(map) : [];
}

export function citiesForState(country?: string, state?: string): string[] {
  if (!country || !state) return [];
  return REGION_MAP[country]?.[state] || [];
}

export function lookupPostcode(
  postcode: string,
  countryHint?: string
): {
  city?: string;
  state?: string;
  country?: string;
} | null {
  const code = postcode.trim();
  if (!code) return null;
  const hint =
    countryHint && countryHint !== "Other" ? countryHint : undefined;
  const exact = POSTCODE_LOOKUP[code];
  if (exact && (!hint || exact.country === hint)) return exact;

  if (!hint || hint === "Australia") {
    const auState = auStateFromPostcode(code);
    if (auState) {
      return {
        state: auState,
        country: "Australia",
        city: exact?.country === "Australia" ? exact.city : undefined,
      };
    }
  }

  if (!hint || hint === "India") {
    const inState = inStateFromPincode(code);
    if (inState) {
      return {
        state: inState,
        country: "India",
        city: exact?.country === "India" ? exact.city : undefined,
      };
    }
  }

  return null;
}

export function postcodeLabel(country?: string): string {
  return country === "India" ? "Pincode" : "Postcode";
}

export function emptyAddress(country = "Australia"): AddressValue {
  return { street: "", city: "", state: "", postcode: "", country };
}

export function formatAddress(value: AddressValue): string {
  const locality = [value.city, value.state, value.postcode]
    .map((part) => (part || "").trim())
    .filter(Boolean)
    .join(" ");
  return [value.street, locality, value.country]
    .map((part) => (part || "").trim())
    .filter(Boolean)
    .join(", ");
}

export function addressFromProfile(profile?: {
  street?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  address?: string;
  companyLocation?: string;
} | null): AddressValue {
  if (!profile) return emptyAddress();
  if (profile.city || profile.state || profile.postcode || profile.street) {
    return {
      street: profile.street || "",
      city: profile.city || "",
      state: profile.state || "",
      postcode: profile.postcode || "",
      country: profile.country || "Australia",
    };
  }
  return parseAddressString(profile.address || profile.companyLocation || "");
}

export function addressFromJob(job?: {
  street?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  location?: string;
} | null): AddressValue {
  if (!job) return emptyAddress();
  if (job.city || job.state || job.postcode || job.street) {
    return {
      street: job.street || "",
      city: job.city || "",
      state: job.state || "",
      postcode: job.postcode || "",
      country: job.country || "Australia",
    };
  }
  return parseAddressString(job.location || "");
}

export function parseAddressString(raw: string): AddressValue {
  const text = raw.trim();
  if (!text) return emptyAddress();
  const parts = text.split(",").map((part) => part.trim()).filter(Boolean);
  const country =
    ADDRESS_COUNTRIES.find((item) =>
      text.toLowerCase().includes(item.toLowerCase())
    ) || "Australia";
  const postcodeMatch = text.match(/\b(\d{4}|\d{6})\b/);
  const postcode = postcodeMatch?.[1] || "";
  const lookedUp = postcode ? lookupPostcode(postcode) : null;
  const street = parts[0] && !/^\d{4,6}$/.test(parts[0]) ? parts[0] : "";
  return {
    street,
    city: lookedUp?.city || "",
    state: lookedUp?.state || "",
    postcode,
    country: lookedUp?.country || country,
  };
}
