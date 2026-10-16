import { getAccessToken } from "@/lib/keycloak";

export const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8082";

export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  if (!token) throw new Error("Sign in before calling the API.");

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(new URL(path, `${apiBaseUrl}/`), { ...init, headers });
}

/** A failed API call, with the server's explanation when it sent one (problem details "detail"). */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function readJson<T>(response: Response): Promise<T> {
  if (response.ok) return (response.status === 204 ? undefined : await response.json()) as T;
  let detail = "";
  try {
    const body = await response.json();
    detail = body.detail ?? body.message ?? "";
  } catch {
    // No JSON body; the status says enough.
  }
  const fallback =
    response.status === 401 ? "Sign in again to continue." : response.status === 403 ? "Your account is not allowed to do this." : `The server answered ${response.status}.`;
  throw new ApiError(detail || fallback, response.status);
}

/** GET a public endpoint (no sign-in). */
export async function getPublic<T>(path: string, signal?: AbortSignal): Promise<T> {
  return readJson<T>(await fetch(new URL(path, `${apiBaseUrl}/`), { signal }));
}

/** Signed-in JSON call: sends `body` as JSON, returns the parsed response. */
export async function apiJson<T>(path: string, method: "GET" | "POST" | "PUT" | "DELETE" = "GET", body?: unknown): Promise<T> {
  const response = await apiFetch(path, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return readJson<T>(response);
}
