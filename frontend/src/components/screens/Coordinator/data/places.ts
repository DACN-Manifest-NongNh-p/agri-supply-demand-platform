// Approximate map positions for the demo's farming areas and buyer cities, [longitude, latitude].
// The mock data stores places as text; a real backend would store coordinates per farm and DC.

/** Which side of its pin a label sits on, so neighbouring labels do not overlap. */
export type LabelSide = "left" | "right" | "top" | "bottom";

export type Place = { name: string; at: [number, number]; side: LabelSide };

export type FarmArea = Place & { province: string };

/** Provinces the coordinator can focus on; each is run as a hub. */
export const PROVINCES = ["Binh Thuan", "Lam Dong", "Dak Lak", "Khanh Hoa", "Tien Giang", "Dong Thap"] as const;

/** Where a province's pin sits on the all-regions map; label sides keep the Mekong and Saigon labels apart. */
export const PROVINCE_PINS: Record<string, Omit<Place, "name">> = {
  "Binh Thuan": { at: [108.05, 11.1], side: "right" },
  "Lam Dong": { at: [108.2, 11.73], side: "right" },
  "Dak Lak": { at: [108.33, 12.7], side: "left" },
  "Khanh Hoa": { at: [109.1, 12.08], side: "top" },
  "Tien Giang": { at: [106.3, 10.38], side: "right" },
  "Dong Thap": { at: [105.64, 10.46], side: "bottom" },
};

const DISTRICTS: Record<string, Omit<FarmArea, "name">> = {
  "Ham Thuan Nam": { province: "Binh Thuan", at: [107.94, 10.9], side: "bottom" },
  "Thuan Nam": { province: "Binh Thuan", at: [108.14, 11.08], side: "right" },
  "Bac Binh": { province: "Binh Thuan", at: [108.36, 11.23], side: "top" },
  "Tanh Linh": { province: "Binh Thuan", at: [107.68, 11.1], side: "top" },
  "Lam Ha": { province: "Lam Dong", at: [108.2, 11.73], side: "right" },
  "Krong Pac": { province: "Dak Lak", at: [108.33, 12.7], side: "right" },
  "Cai Lay": { province: "Tien Giang", at: [106.12, 10.41], side: "left" },
  "Cho Gao": { province: "Tien Giang", at: [106.46, 10.36], side: "right" },
  "Cam Lam": { province: "Khanh Hoa", at: [109.1, 12.08], side: "right" },
  "Cao Lanh": { province: "Dong Thap", at: [105.64, 10.46], side: "top" },
};

/** Communes that map to their district at this map scale. */
const COMMUNES: Record<string, string> = {
  "Ham Kiem": "Ham Thuan Nam",
  "Muong Man": "Ham Thuan Nam",
};

/** The farming district of a batch region such as "Ham Kiem, Binh Thuan". */
export function farmArea(region: string): FarmArea | undefined {
  const local = region.split(",")[0].trim();
  const name = COMMUNES[local] ?? local;
  const district = DISTRICTS[name];
  return district && { name, ...district };
}

/** The province of a free-text place, matched by province, district or commune name. */
export function provinceOf(place: string): string | undefined {
  const province = PROVINCES.find((name) => place.includes(name));
  if (province) return province;
  const local = [...Object.keys(DISTRICTS), ...Object.keys(COMMUNES)].find((name) => place.includes(name));
  return local && DISTRICTS[COMMUNES[local] ?? local].province;
}

const HO_CHI_MINH: Place = { name: "Ho Chi Minh City", at: [106.7, 10.78], side: "left" };
const BINH_DUONG: Place = { name: "Binh Duong", at: [106.66, 10.98], side: "top" };

/** Buyers are grouped by city: at this map scale the districts of Ho Chi Minh City overlap. */
export function buyerCity(destination: string): Place {
  return /binh duong|thu dau mot/i.test(destination) ? BINH_DUONG : HO_CHI_MINH;
}
