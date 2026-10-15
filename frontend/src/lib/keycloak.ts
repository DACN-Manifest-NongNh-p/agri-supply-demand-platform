import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL ?? "http://localhost:8081",
  realm: import.meta.env.VITE_KEYCLOAK_REALM ?? "agri-platform",
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? "farmora-web",
});

let initializationPromise: Promise<boolean> | undefined;

export function initializeKeycloak() {
  initializationPromise ??= keycloak.init({
    onLoad: "check-sso",
    pkceMethod: "S256",
    checkLoginIframe: false,
    silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
  });

  return initializationPromise;
}

/** Where Keycloak sends the browser after login/registration; it then routes by role. */
export const AUTH_CALLBACK_PATH = "/auth/callback";

/**
 * `returnTo` is an app path to open after login (e.g. a protected page the user tried to visit).
 * Without it, the callback page picks the home page for the user's role.
 */
async function redirectToKeycloak(action: "login" | "register", returnTo?: string) {
  await initializeKeycloak().catch(() => false);
  const callback = new URL(AUTH_CALLBACK_PATH, window.location.origin);
  if (returnTo) callback.searchParams.set("returnTo", returnTo);
  const options = { redirectUri: callback.href };

  return action === "register" ? keycloak.register(options) : keycloak.login(options);
}

export function loginWithKeycloak(returnTo?: string) {
  return redirectToKeycloak("login", returnTo);
}

export function registerWithKeycloak() {
  return redirectToKeycloak("register");
}

export async function logoutFromKeycloak() {
  await initializeKeycloak().catch(() => false);
  return keycloak.logout({ redirectUri: `${window.location.origin}/` });
}

export async function getAccessToken() {
  const authenticated = await initializeKeycloak();
  if (!authenticated || !keycloak.authenticated) return null;

  await keycloak.updateToken(30);
  return keycloak.token ?? null;
}

export function isKeycloakAuthenticated() {
  return Boolean(keycloak.authenticated);
}

export type AppRole = "BUYER" | "PRODUCER" | "LOGISTICS" | "COORDINATOR" | "ADMIN";

// UI-only check; the backend enforces the same roles from the access token.
export function hasRole(role: AppRole) {
  return keycloak.hasRealmRole(role);
}

export function getKeycloakUsername() {
  return keycloak.tokenParsed?.preferred_username ?? keycloak.tokenParsed?.email ?? "";
}

/** Roles that have their own area in the app, in priority order, with the area's home path. */
const ROLE_HOMES: { role: AppRole; path: string }[] = [
  { role: "PRODUCER", path: "/producer" },
  { role: "BUYER", path: "/buyer" },
];

/** Home page for the signed-in user's role, or null if their role has no area yet. */
export function getRoleHomePath(): string | null {
  if (!keycloak.authenticated) return null;
  return ROLE_HOMES.find(({ role }) => hasRole(role))?.path ?? null;
}
