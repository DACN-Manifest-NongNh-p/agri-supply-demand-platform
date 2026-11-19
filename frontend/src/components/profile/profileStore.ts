// The signed-in user's profile per area (demo): who they are and the farm or company they act for.
// Kept in this browser until the backend stores profiles; every component reading it updates together.
import { useSyncExternalStore } from "react";
import { getKeycloakIdentity, getKeycloakUsername, isKeycloakAuthenticated } from "@/lib/keycloak";
import { producer } from "@/components/screens/Producer/data/mockProducer";
import { buyer } from "@/components/screens/Buyer/data/mockBuyer";

export type ProfileArea = "buyer" | "producer";

/** Details the owner can show to the other side of the market or keep for Farmora and the coordinator. */
export type ProfileField =
  | "contact"
  | "email"
  | "phone"
  | "address"
  | "taxId"
  | "website"
  | "volume"
  | "certifications"
  | "hectares"
  | "products"
  | "about";

export const PROFILE_FIELD_LABEL: Record<ProfileField, string> = {
  contact: "Contact person and job title",
  email: "Email",
  phone: "Phone",
  address: "Business address",
  taxId: "Tax / business registration number",
  website: "Website",
  volume: "Typical volume",
  certifications: "Certifications",
  hectares: "Growing area",
  products: "Products",
  about: "About",
};

/** True = buyers and producers can see it; false = only you, the coordinator and Farmora see it. */
export type Visibility = Record<ProfileField, boolean>;

export const DEFAULT_VISIBILITY: Visibility = {
  contact: true,
  email: false,
  phone: false,
  address: false,
  taxId: false,
  website: true,
  volume: true,
  certifications: true,
  hectares: true,
  products: true,
  about: true,
};

export type Profile = {
  name: string;
  title: string;
  email: string;
  phone: string;
  /** Square photo as a data URL, or null for initials. */
  photo: string | null;
  org: {
    name: string;
    type: string;
    region: string;
    /** Growing area in hectares (producers); null until filled in. */
    hectares: number | null;
    products: string[];
    about: string;
    /** Registered business address (not a delivery point). */
    address: string;
    taxId: string;
    website: string;
    /** How much the farm sells or the company buys, in the owner's words ("about 20 t a month"). */
    volume: string;
    /** VietGAP, GlobalGAP, organic… (producers). */
    certifications: string[];
  };
  /** Which details the other side of the market sees. */
  visibility: Visibility;
};

// A real account starts with only what Keycloak knows (name, email); the rest is filled in on the
// profile page. The demo (nobody signed in) shows the sample farm and company.
function blank(): Profile {
  const identity = getKeycloakIdentity();
  return {
    name: identity.name || getKeycloakUsername(),
    title: "",
    email: identity.email,
    phone: "",
    photo: null,
    org: { name: "", type: "", region: "", hectares: null, products: [], about: "", address: "", taxId: "", website: "", volume: "", certifications: [] },
    visibility: { ...DEFAULT_VISIBILITY },
  };
}

function defaults(area: ProfileArea): Profile {
  if (isKeycloakAuthenticated()) return blank();
  if (area === "producer") {
    return {
      name: producer.contact,
      title: "Cooperative manager",
      email: "hoa@hoaphat.coop",
      phone: "0912 345 678",
      photo: null,
      org: {
        name: producer.name,
        type: "Cooperative",
        region: producer.region,
        hectares: producer.hectares,
        products: producer.products,
        about: "Family cooperative growing VietGAP dragon fruit, mango and pomelo for supermarkets and exporters.",
        address: "Hamlet 3, Ham Thuan Nam, Binh Thuan",
        taxId: "3400 112 857",
        website: "hoaphat.coop",
        volume: "About 25 t a month in season",
        certifications: ["VietGAP", "GlobalGAP"],
      },
      visibility: { ...DEFAULT_VISIBILITY },
    };
  }
  return {
    name: buyer.contact,
    title: buyer.role,
    email: "anh.tran@greenbasket.vn",
    phone: "0903 222 118",
    photo: null,
    org: {
      name: buyer.name,
      type: buyer.type,
      region: "District 7, Ho Chi Minh City",
      hectares: null,
      products: buyer.products,
      about: "Supermarket chain with 24 stores in Ho Chi Minh City, buying fresh fruit direct from growers.",
      address: "12 Nguyen Huu Tho, Tan Hung, District 7, Ho Chi Minh City",
      taxId: "0313 554 201",
      website: "greenbasket.vn",
      volume: "40–60 t of fruit a month",
      certifications: [],
    },
    visibility: { ...DEFAULT_VISIBILITY },
  };
}

// One saved profile per account (and one for the demo), so two accounts on this browser stay apart.
const storageKey = (area: ProfileArea) => `farmora-profile-${area}-${getKeycloakUsername() || "demo"}`;

function load(area: ProfileArea): Profile {
  const base = defaults(area);
  try {
    const saved = localStorage.getItem(storageKey(area));
    if (!saved) return base;
    const parsed = JSON.parse(saved) as Partial<Profile>;
    return { ...base, ...parsed, org: { ...base.org, ...parsed.org }, visibility: { ...base.visibility, ...parsed.visibility } };
  } catch {
    return base;
  }
}

const cache = new Map<ProfileArea, Profile>();
const listeners = new Set<() => void>();

function read(area: ProfileArea) {
  let profile = cache.get(area);
  if (!profile) {
    profile = load(area);
    cache.set(area, profile);
  }
  return profile;
}

export function saveProfile(area: ProfileArea, profile: Profile) {
  cache.set(area, profile);
  try {
    localStorage.setItem(storageKey(area), JSON.stringify(profile));
  } catch {
    // Too large or storage blocked: kept for this visit only.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useProfile(area: ProfileArea) {
  return useSyncExternalStore(subscribe, () => read(area));
}

/** The saved profile outside React (the party directory reads it). */
export function getProfile(area: ProfileArea) {
  return read(area);
}

export function subscribeProfiles(listener: () => void) {
  return subscribe(listener);
}

/** True until the farm or company has a name; the home card then asks to complete the profile. */
export function isIncomplete(profile: Profile) {
  return !profile.org.name.trim();
}

/** Details still empty, in the words the reminder banner uses ("company name", "phone"…). */
export function missingFields(area: ProfileArea, profile: Profile) {
  const org = area === "producer" ? "farm" : "company";
  const checks: [boolean, string][] = [
    [!profile.org.name.trim(), `${org} name`],
    [!profile.title.trim(), "job title"],
    [!profile.phone.trim(), "phone"],
    [!profile.org.region.trim(), area === "producer" ? "growing region" : "office address"],
    [profile.org.products.length === 0, area === "producer" ? "crops" : "products you buy"],
    [!profile.org.address.trim(), "business address"],
    [!profile.org.volume.trim(), area === "producer" ? "typical harvest volume" : "typical order volume"],
  ];
  return checks.filter(([empty]) => empty).map(([, label]) => label);
}

/** "Tran Minh Anh" → "TA"; one word gives one letter. */
export function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/** Shrinks a picked image to a centred square so it fits in browser storage. */
export function squarePhoto(file: File, size = 240): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const side = Math.min(image.width, image.height);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      canvas.getContext("2d")?.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image."));
    };
    image.src = url;
  });
}
