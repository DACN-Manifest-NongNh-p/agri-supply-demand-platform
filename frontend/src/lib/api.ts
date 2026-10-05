import { getAccessToken } from "@/lib/keycloak";

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8082";

export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  if (!token) throw new Error("Sign in before calling the API.");

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(new URL(path, `${apiBaseUrl}/`), { ...init, headers });
}