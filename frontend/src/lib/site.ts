// Site configuration an admin edits in /admin instead of in code: page text, operating rules,
// the product catalog and announcements. Loaded once at start-up from /api/public/site; every
// value has a built-in default, so the app still works when the API is not running.
import { useSyncExternalStore } from "react";
import { getPublic } from "@/lib/api";

export type RuleKey =
  | "autoMatchMinScore"
  | "lockMinutes"
  | "depositPercent"
  | "signOffKg"
  | "holdHours"
  | "holdWarningHours"
  | "dueSoonDays"
  | "sellSoonDays"
  | "coldChainMin"
  | "coldChainMax";

export type Rule = {
  key: RuleKey;
  label: string;
  description: string;
  unit: string;
  value: number;
  defaultValue: number;
  min: number;
  max: number;
  updatedAt?: string | null;
  updatedBy?: string | null;
};

export type ProductCategory = "FRUIT" | "VEGETABLE" | "OTHER";

export type CatalogProduct = {
  id?: number;
  name: string;
  nameVi?: string | null;
  category: ProductCategory;
  coldChain: boolean;
  active: boolean;
  sortOrder: number;
};

export type Audience = "PUBLIC" | "PRODUCER" | "BUYER" | "COORDINATOR" | "LOGISTICS";
export type AnnouncementTone = "INFO" | "WARNING" | "URGENT";

export type Announcement = {
  id: number;
  message: string;
  tone: AnnouncementTone;
  audiences: Audience[];
  startsAt?: string | null;
  endsAt?: string | null;
  active: boolean;
  live: boolean;
  updatedAt?: string;
  updatedBy?: string | null;
};

export type SiteState = {
  /** Page text overrides by content key; missing keys use the default text in siteContent.ts. */
  content: Record<string, string>;
  rules: Rule[];
  products: CatalogProduct[];
  announcements: Announcement[];
  /** "api" once loaded from the server; "defaults" when it could not be reached. */
  source: "api" | "defaults";
};

const DEFAULT_RULES: Rule[] = [
  { key: "autoMatchMinScore", label: "Auto-match score", unit: "%", value: 75, defaultValue: 75, min: 50, max: 100, description: "Matches scoring at least this are held automatically; lower ones wait for a coordinator." },
  { key: "lockMinutes", label: "Checkout lock", unit: "min", value: 15, defaultValue: 15, min: 1, max: 120, description: "Minutes a buyer has to pay the deposit after picking a batch; then the kilograms go back on the market." },
  { key: "depositPercent", label: "Deposit", unit: "%", value: 50, defaultValue: 50, min: 10, max: 100, description: "Share of the order value a buyer pays up front to confirm an order; the rest is paid on delivery." },
  { key: "signOffKg", label: "Sign-off quantity", unit: "kg", value: 3000, defaultValue: 3000, min: 100, max: 100000, description: "Holds of this many kilograms or more need a coordinator's approval." },
  { key: "holdHours", label: "Hold length", unit: "h", value: 24, defaultValue: 24, min: 1, max: 168, description: "Hours a producer has to confirm a hold before it lapses." },
  { key: "holdWarningHours", label: "Hold warning", unit: "h", value: 6, defaultValue: 6, min: 1, max: 48, description: "Warn the producer, buyer and coordinator when a hold has this many hours or less left." },
  { key: "dueSoonDays", label: "Demand due soon", unit: "days", value: 3, defaultValue: 3, min: 1, max: 30, description: "A demand needed within this many days and not fully sourced is flagged." },
  { key: "sellSoonDays", label: "Selling soon", unit: "days", value: 3, defaultValue: 3, min: 1, max: 30, description: "Unsold kilograms within this many days of their sell-by date are listed first." },
  { key: "coldChainMin", label: "Cold chain minimum", unit: "°C", value: 2, defaultValue: 2, min: -10, max: 15, description: "Lowest safe temperature for refrigerated shipments." },
  { key: "coldChainMax", label: "Cold chain maximum", unit: "°C", value: 8, defaultValue: 8, min: 0, max: 25, description: "Highest safe temperature for refrigerated shipments." },
];

const DEFAULT_PRODUCTS: CatalogProduct[] = [
  ["Dragon fruit", "Thanh long", true],
  ["Mango", "Xoài", true],
  ["Pomelo", "Bưởi", false],
  ["Avocado", "Bơ", true],
  ["Durian", "Sầu riêng", true],
  ["Rambutan", "Chôm chôm", true],
  ["Longan", "Nhãn", true],
  ["Lychee", "Vải thiều", true],
  ["Mangosteen", "Măng cụt", true],
  ["Banana", "Chuối", false],
  ["Pineapple", "Dứa", false],
].map(([name, nameVi, coldChain], index) => ({ name: name as string, nameVi: nameVi as string, category: "FRUIT", coldChain: coldChain as boolean, active: true, sortOrder: (index + 1) * 10 }));

let state: SiteState = { content: {}, rules: DEFAULT_RULES, products: DEFAULT_PRODUCTS, announcements: [], source: "defaults" };
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/** Replaces part of the site state (after loading, or after an admin saves) and re-renders readers. */
export function updateSite(change: Partial<SiteState>) {
  state = { ...state, ...change };
  emit();
}

export function getSite() {
  return state;
}

/** Reads the site configuration in a component; re-renders when an admin saves. */
export function useSite() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
  );
}

/** Current value of an operating rule, for logic outside React (matching, alerts, holds). */
export function rule(key: RuleKey): number {
  return state.rules.find((item) => item.key === key)?.value ?? DEFAULT_RULES.find((item) => item.key === key)!.value;
}

type SiteResponse = {
  content: Record<string, string>;
  rules: (Omit<Rule, "value" | "defaultValue" | "min" | "max"> & { value: number | string; defaultValue: number | string; min: number | string; max: number | string })[];
  products: CatalogProduct[];
  announcements: Announcement[];
};

export function normalizeRules(rules: SiteResponse["rules"]): Rule[] {
  return rules.map((item) => ({ ...item, value: Number(item.value), defaultValue: Number(item.defaultValue), min: Number(item.min), max: Number(item.max) }));
}

/** Loads the configuration; gives up after `timeoutMs` and keeps the defaults. */
export async function loadSite(timeoutMs = 2500) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const site = await getPublic<SiteResponse>("api/public/site", controller.signal);
    updateSite({ content: site.content, rules: normalizeRules(site.rules), products: site.products, announcements: site.announcements, source: "api" });
  } catch (error) {
    console.warn("Site configuration not loaded; using the built-in defaults.", error);
  } finally {
    window.clearTimeout(timer);
  }
}

/** Operating rules as properties (RULES.holdHours), read at the moment they are used. */
export const RULES = {
  get autoMatchMinScore() {
    return rule("autoMatchMinScore");
  },
  get lockMinutes() {
    return rule("lockMinutes");
  },
  get depositPercent() {
    return rule("depositPercent");
  },
  get signOffKg() {
    return rule("signOffKg");
  },
  get holdHours() {
    return rule("holdHours");
  },
  get holdWarningHours() {
    return rule("holdWarningHours");
  },
  get dueSoonDays() {
    return rule("dueSoonDays");
  },
  get sellSoonDays() {
    return rule("sellSoonDays");
  },
  get coldChainMin() {
    return rule("coldChainMin");
  },
  get coldChainMax() {
    return rule("coldChainMax");
  },
};
