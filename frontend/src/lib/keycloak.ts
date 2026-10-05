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

async function redirectToKeycloak(action: "login" | "register") {
  await initializeKeycloak().catch(() => false);
  const options = { redirectUri: `${window.location.origin}/` };

  return action === "register" ? keycloak.register(options) : keycloak.login(options);
}

export function loginWithKeycloak() {
  return redirectToKeycloak("login");
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

export function getKeycloakUsername() {
  return keycloak.tokenParsed?.preferred_username ?? keycloak.tokenParsed?.email ?? "";
}