// Calls to /api/admin (ADMIN only). Each change is also applied to the site store, so the rest of
// the app (and the landing page opened from here) shows it straight away.
import { apiJson } from "@/lib/api";
import { normalizeRules, updateSite, type Announcement, type Audience, type AnnouncementTone, type CatalogProduct, type Rule } from "@/lib/site";

export async function saveContent(values: Record<string, string | null>) {
  const content = await apiJson<Record<string, string>>("api/admin/content", "PUT", { values });
  updateSite({ content });
  return content;
}

export async function saveRules(values: Record<string, number | null>) {
  const rules: Rule[] = normalizeRules(await apiJson("api/admin/rules", "PUT", { values }));
  updateSite({ rules });
  return rules;
}

export type AnnouncementDraft = {
  message: string;
  tone: AnnouncementTone;
  audiences: Audience[];
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
};

function publishLive(all: Announcement[]) {
  updateSite({ announcements: all.filter((item) => item.live) });
}

export async function listAnnouncements() {
  const all = await apiJson<Announcement[]>("api/admin/announcements");
  publishLive(all);
  return all;
}

export async function saveAnnouncement(id: number | null, draft: AnnouncementDraft) {
  if (id === null) await apiJson<Announcement>("api/admin/announcements", "POST", draft);
  else await apiJson<Announcement>(`api/admin/announcements/${id}`, "PUT", draft);
  return listAnnouncements();
}

export async function deleteAnnouncement(id: number) {
  await apiJson<void>(`api/admin/announcements/${id}`, "DELETE");
  return listAnnouncements();
}

export async function listProducts() {
  const all = await apiJson<CatalogProduct[]>("api/admin/products");
  updateSite({ products: all.filter((product) => product.active) });
  return all;
}

export async function saveProduct(product: CatalogProduct) {
  const body = { ...product, nameVi: product.nameVi || null };
  if (product.id === undefined) await apiJson<CatalogProduct>("api/admin/products", "POST", body);
  else await apiJson<CatalogProduct>(`api/admin/products/${product.id}`, "PUT", body);
  return listProducts();
}

/** A Farmora account as stored in app_user (copied from Keycloak). Sign-in times are null until the person opens the app. */
export type AppUser = {
  id: string;
  username: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  emailVerified: boolean;
  enabled: boolean;
  accountType: string | null;
  roles: string[];
  registeredAt: string | null;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  syncedAt: string | null;
};

export function listUsers() {
  return apiJson<AppUser[]>("api/admin/users");
}

/** Copies every account from Keycloak into app_user and returns the updated list. */
export function syncUsers() {
  return apiJson<{ fromKeycloak: number; syncedAt: string; users: AppUser[] }>("api/admin/users/sync", "POST");
}

const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL ?? "http://localhost:8081";
const KEYCLOAK_REALM = import.meta.env.VITE_KEYCLOAK_REALM ?? "agri-platform";

/** Keycloak's admin console for the Farmora realm (users, passwords, roles). */
export const KEYCLOAK_CONSOLE = `${KEYCLOAK_URL}/admin/${KEYCLOAK_REALM}/console/`;

/** One user's page in the Keycloak console. */
export const keycloakUserUrl = (id: string) => `${KEYCLOAK_CONSOLE}#/${KEYCLOAK_REALM}/users/${id}/settings`;

export const AUDIENCE_LABEL: Record<Audience, string> = {
  PUBLIC: "Public website",
  PRODUCER: "Producers",
  BUYER: "Buyers",
  COORDINATOR: "Coordinators",
  LOGISTICS: "Logistics providers",
};

export const TONE_LABEL: Record<AnnouncementTone, string> = { INFO: "Information", WARNING: "Warning", URGENT: "Urgent" };
