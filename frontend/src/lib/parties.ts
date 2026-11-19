// Directory of every buyer and producer on the market, so any area can open "who is this?" for a
// name it shows. The two demo accounts (Hoa Phat as the producer, GreenBasket as the buyer) take their
// details from the profile the user edits, so what they publish there is what the other side sees.
// Ids are slugs of the business name: the demo data refers to parties by name everywhere.
import { useSyncExternalStore } from "react";
import { producer as demoProducer } from "@/components/screens/Producer/data/mockProducer";
import { buyer as demoBuyer } from "@/components/screens/Buyer/data/mockBuyer";
import { producerProfile } from "@/components/screens/Buyer/data/producers";
import {
  DEFAULT_VISIBILITY,
  getProfile,
  subscribeProfiles,
  type Profile,
  type ProfileArea,
  type ProfileField,
  type Visibility,
} from "@/components/profile/profileStore";

export type PartyRole = "buyer" | "producer";

export type Party = {
  id: string;
  role: PartyRole;
  name: string;
  /** "Retail chain", "Cooperative"… */
  type: string;
  region: string;
  products: string[];
  memberSince: number;
  completedOrders: number;
  rating?: number;
  ratingCount?: number;
  verified: boolean;
  contactName: string;
  title: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  website: string;
  volume: string;
  certifications: string[];
  hectares: number | null;
  about: string;
  visibility: Visibility;
};

export const partyId = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** The accounts the demo user plays in the producer and buyer areas. */
export const SELF_PRODUCER_ID = partyId(demoProducer.name);
export const SELF_BUYER_ID = partyId(demoBuyer.name);

type Seed = Omit<Party, "id" | "visibility" | "verified" | "rating" | "ratingCount" | "completedOrders" | "memberSince" | "certifications"> &
  Partial<Pick<Party, "verified" | "rating" | "ratingCount" | "completedOrders" | "memberSince" | "certifications">> & {
    visibility?: Partial<Visibility>;
  };

const BUYERS: Seed[] = [
  { role: "buyer", name: demoBuyer.name, type: demoBuyer.type, region: "District 7, Ho Chi Minh City", products: demoBuyer.products, contactName: demoBuyer.contact, title: demoBuyer.role, email: "anh.tran@greenbasket.vn", phone: "0903 222 118", address: "12 Nguyen Huu Tho, District 7, Ho Chi Minh City", taxId: "0313 554 201", website: "greenbasket.vn", volume: "40–60 t of fruit a month", hectares: null, about: "Supermarket chain with 24 stores in Ho Chi Minh City.", memberSince: 2021, completedOrders: 188, rating: 4.7, ratingCount: 92 },
  { role: "buyer", name: "Saigon Fresh Kitchen", type: "Restaurant group", region: "District 1, Ho Chi Minh City", products: ["Mango", "Avocado", "Dragon fruit"], contactName: "Pham Quoc Bao", title: "Purchasing lead", email: "bao@saigonfresh.vn", phone: "0908 441 920", address: "45 Le Loi, District 1, Ho Chi Minh City", taxId: "0314 778 016", website: "saigonfresh.vn", volume: "3–5 t a week across 11 restaurants", hectares: null, about: "Restaurant group buying premium fruit for desserts and drinks.", memberSince: 2022, completedOrders: 74, rating: 4.5, ratingCount: 41 },
  { role: "buyer", name: "Mekong Export Co.", type: "Exporter", region: "Cat Lai, Ho Chi Minh City", products: ["Dragon fruit", "Mango", "Durian"], contactName: "Vo Thi Kim", title: "Sourcing manager", email: "kim.vo@mekongexport.vn", phone: "0937 600 115", address: "Cat Lai Port area, Thu Duc, Ho Chi Minh City", taxId: "0310 220 991", website: "mekongexport.vn", volume: "Containers of 18–22 t", hectares: null, about: "Exports fresh fruit to Korea, Japan and the Middle East. Export packing required.", memberSince: 2021, completedOrders: 96, rating: 4.6, ratingCount: 58 },
  { role: "buyer", name: "Binh Duong School Meals", type: "Institutional", region: "Thu Dau Mot, Binh Duong", products: ["Pomelo", "Mango"], contactName: "Nguyen Thi Lan", title: "Kitchen manager", email: "lan@bdschoolmeals.vn", phone: "0274 382 1100", address: "Thu Dau Mot, Binh Duong", taxId: "3702 115 400", website: "", volume: "About 6 t a month in term time", hectares: null, about: "Central kitchen for 30 schools; grade B is fine.", memberSince: 2024, completedOrders: 18, rating: 4.4, ratingCount: 9 },
  { role: "buyer", name: "Phu Tho Wholesale Market", type: "Wholesale market", region: "District 11, Ho Chi Minh City", products: ["Dragon fruit", "Pomelo", "Mango"], contactName: "Tran Van Phu", title: "Trader", email: "phu@phutho-market.vn", phone: "0918 300 442", address: "Phu Tho Wholesale Market, District 11", taxId: "0301 556 778", website: "", volume: "Daily lots of 2–5 t", hectares: null, about: "Wholesale traders supplying markets across the city.", memberSince: 2021, completedOrders: 240, rating: 4.2, ratingCount: 130 },
  { role: "buyer", name: "Da Lat Fresh Mart", type: "Retail chain", region: "Thu Duc, Ho Chi Minh City", products: ["Durian", "Avocado"], contactName: "Le Minh Chau", title: "Category buyer", email: "chau@dalatfresh.vn", phone: "0909 717 223", address: "Thu Duc, Ho Chi Minh City", taxId: "0316 889 120", website: "dalatfresh.vn", volume: "About 15 t a month", hectares: null, about: "New retail chain focused on highland produce.", memberSince: 2026, completedOrders: 2 },
  { role: "buyer", name: "FreshWay Markets", type: "Retail chain", region: "Binh Thanh, Ho Chi Minh City", products: ["Dragon fruit", "Mango", "Pomelo"], contactName: "Hoang Duc Minh", title: "Fresh buyer", email: "minh@freshway.vn", phone: "0912 600 330", address: "Binh Thanh, Ho Chi Minh City", taxId: "0312 001 554", website: "freshway.vn", volume: "20–30 t a month", hectares: null, about: "Neighbourhood supermarkets in Binh Thanh and Go Vap.", memberSince: 2022, completedOrders: 133, rating: 4.6, ratingCount: 70 },
  { role: "buyer", name: "Saigon Fresh DC", type: "Distributor", region: "Tan Binh, Ho Chi Minh City", products: ["Dragon fruit", "Avocado", "Pomelo", "Mango"], contactName: "Dinh Thu Trang", title: "Supply planner", email: "trang@saigonfreshdc.vn", phone: "0938 220 761", address: "Tan Binh, Ho Chi Minh City", taxId: "0315 662 003", website: "", volume: "10–15 t a week", hectares: null, about: "Distribution centre for restaurants and cafés.", memberSince: 2023, completedOrders: 81, rating: 4.5, ratingCount: 39 },
  { role: "buyer", name: "Mekong Mart", type: "Retail chain", region: "Ninh Kieu, Can Tho", products: ["Mango", "Pomelo", "Dragon fruit"], contactName: "Truong Van Hau", title: "Buyer", email: "hau@mekongmart.vn", phone: "0292 381 7766", address: "Ninh Kieu, Can Tho", taxId: "1801 223 900", website: "mekongmart.vn", volume: "8–12 t a month", hectares: null, about: "Supermarkets across the Mekong Delta; also buys processing grade.", memberSince: 2022, completedOrders: 64, rating: 4.3, ratingCount: 30 },
];

// Producers only the coordinator demo knows; the rest come with a track record (producers.ts).
const EXTRA_PRODUCERS: { name: string; type: string; region: string; products: string[]; since: number; orders: number }[] = [
  { name: demoProducer.name, type: "Cooperative", region: demoProducer.region, products: demoProducer.products, since: 2021, orders: 214 },
  { name: "Thuan Nam Mango Growers", type: "Growers' group", region: "Thuan Nam, Binh Thuan", products: ["Mango"], since: 2022, orders: 131 },
  { name: "Ham Kiem Green Farm", type: "Family farm", region: "Ham Kiem, Binh Thuan", products: ["Dragon fruit"], since: 2023, orders: 52 },
  { name: "Green Hills Farm", type: "Family farm", region: "Tanh Linh, Binh Thuan", products: ["Mango"], since: 2025, orders: 11 },
  { name: "Muong Man Pomelo Cooperative", type: "Cooperative", region: "Muong Man, Binh Thuan", products: ["Pomelo"], since: 2021, orders: 167 },
  { name: "Bac Binh Citrus Farm", type: "Family farm", region: "Bac Binh, Binh Thuan", products: ["Pomelo"], since: 2024, orders: 29 },
  { name: "Lam Ha Avocado Cooperative", type: "Cooperative", region: "Lam Ha, Lam Dong", products: ["Avocado"], since: 2022, orders: 102 },
  { name: "Cai Lay Durian Garden", type: "Family farm", region: "Cai Lay, Tien Giang", products: ["Durian"], since: 2025, orders: 6 },
  { name: "Cho Gao Dragon Fruit Co-op", type: "Cooperative", region: "Cho Gao, Tien Giang", products: ["Dragon fruit"], since: 2024, orders: 34 },
  { name: "Cai Lay Pomelo Farm", type: "Family farm", region: "Cai Lay, Tien Giang", products: ["Pomelo"], since: 2023, orders: 40 },
  { name: "Cao Lanh Mango Cooperative", type: "Cooperative", region: "Cao Lanh, Dong Thap", products: ["Mango"], since: 2022, orders: 88 },
  { name: "Cam Lam Mango Growers", type: "Growers' group", region: "Cam Lam, Khanh Hoa", products: ["Mango"], since: 2026, orders: 0 },
  { name: "Krong Pac Highland Farm", type: "Family farm", region: "Krong Pac, Dak Lak", products: ["Avocado", "Durian"], since: 2023, orders: 27 },
];

const PRODUCERS: Seed[] = EXTRA_PRODUCERS.map((item) => {
  const track = producerProfile(item.name);
  const slug = partyId(item.name).split("-")[0];
  return {
    role: "producer",
    name: item.name,
    type: item.type,
    region: item.region,
    products: item.products,
    contactName: "",
    title: "Farm manager",
    email: `sales@${slug}.farm.vn`,
    phone: "",
    address: item.region,
    taxId: "",
    website: "",
    volume: "",
    hectares: null,
    about: "",
    memberSince: track?.memberSince ?? item.since,
    completedOrders: track?.completedOrders ?? item.orders,
    rating: track?.rating,
    ratingCount: track?.ratingCount,
    verified: track?.verified ?? false,
    certifications: track?.certifications ?? [],
  };
});

function fromSeed(seed: Seed): Party {
  return {
    verified: true,
    memberSince: 2024,
    completedOrders: 0,
    certifications: [],
    ...seed,
    id: partyId(seed.name),
    visibility: { ...DEFAULT_VISIBILITY, ...seed.visibility },
  };
}

const BASE: Party[] = [...BUYERS, ...PRODUCERS].map(fromSeed);

/** The demo account's own profile, laid over its directory entry: the profile page is where it is edited. */
function withProfile(party: Party, profile: Profile): Party {
  return {
    ...party,
    name: profile.org.name.trim() || party.name,
    type: profile.org.type || party.type,
    region: profile.org.region || party.region,
    products: profile.org.products.length ? profile.org.products : party.products,
    contactName: profile.name,
    title: profile.title,
    email: profile.email,
    phone: profile.phone,
    address: profile.org.address,
    taxId: profile.org.taxId,
    website: profile.org.website,
    volume: profile.org.volume,
    certifications: profile.org.certifications.length ? profile.org.certifications : party.certifications,
    hectares: profile.org.hectares,
    about: profile.org.about,
    visibility: profile.visibility,
  };
}

const SELF_AREA: Record<string, ProfileArea> = { [SELF_PRODUCER_ID]: "producer", [SELF_BUYER_ID]: "buyer" };

let cache: { profiles: [Profile, Profile]; parties: Party[] } | null = null;

function all(): Party[] {
  const profiles: [Profile, Profile] = [getProfile("producer"), getProfile("buyer")];
  if (cache && cache.profiles[0] === profiles[0] && cache.profiles[1] === profiles[1]) return cache.parties;
  const parties = BASE.map((party) => {
    const area = SELF_AREA[party.id];
    return area ? withProfile(party, area === "producer" ? profiles[0] : profiles[1]) : party;
  });
  cache = { profiles, parties };
  return parties;
}

export function getParties() {
  return all();
}

export function useParties() {
  return useSyncExternalStore(subscribeProfiles, all);
}

/** Looks a party up by id or by the business name the demo data uses. */
export function findParty(idOrName: string, parties = all()): Party | undefined {
  const id = partyId(idOrName);
  return parties.find((party) => party.id === id || party.id === idOrName);
}

export function useParty(idOrName: string | undefined) {
  const parties = useParties();
  return idOrName ? findParty(idOrName, parties) : undefined;
}

/** A name the demo has no entry for still gets a minimal card, so links never break. */
export function partyOrStub(name: string, role: PartyRole, parties = all()): Party {
  return (
    findParty(name, parties) ??
    fromSeed({ role, name, type: role === "buyer" ? "Buyer" : "Producer", region: "", products: [], contactName: "", title: "", email: "", phone: "", address: "", taxId: "", website: "", volume: "", hectares: null, about: "", verified: false })
  );
}

const FIELD_VALUE: Record<ProfileField, (party: Party) => boolean> = {
  contact: (party) => Boolean(party.contactName || party.title),
  email: (party) => Boolean(party.email),
  phone: (party) => Boolean(party.phone),
  address: (party) => Boolean(party.address),
  taxId: (party) => Boolean(party.taxId),
  website: (party) => Boolean(party.website),
  volume: (party) => Boolean(party.volume),
  certifications: (party) => party.certifications.length > 0,
  hectares: (party) => party.hectares !== null,
  products: (party) => party.products.length > 0,
  about: (party) => Boolean(party.about),
};

/**
 * What the other side of the market sees: private details are blanked, and `hidden` lists the ones
 * that exist but are kept private (shown as "Shared after an order is confirmed").
 */
export function publicView(party: Party): Party & { hidden: ProfileField[] } {
  const hidden = (Object.keys(FIELD_VALUE) as ProfileField[]).filter((field) => !party.visibility[field] && FIELD_VALUE[field](party));
  const show = (field: ProfileField) => party.visibility[field];
  return {
    ...party,
    contactName: show("contact") ? party.contactName : "",
    title: show("contact") ? party.title : "",
    email: show("email") ? party.email : "",
    phone: show("phone") ? party.phone : "",
    address: show("address") ? party.address : "",
    taxId: show("taxId") ? party.taxId : "",
    website: show("website") ? party.website : "",
    volume: show("volume") ? party.volume : "",
    certifications: show("certifications") ? party.certifications : [],
    hectares: show("hectares") ? party.hectares : null,
    products: show("products") ? party.products : [],
    about: show("about") ? party.about : "",
    hidden,
  };
}
