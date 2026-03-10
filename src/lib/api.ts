// src/lib/api.ts
import { API_BASE } from "./runtimeConfig";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`);
  }

  // ✅ handle empty responses (DELETE/204/etc)
  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }

  // fallback (rare)
  const text = await res.text();
  return text as unknown as T;
}

export async function adminFetch<T>(
  path: string,
  adminToken: string,
  init?: RequestInit
): Promise<T> {
  const headers = new Headers(init?.headers || {});
  headers.set("X-Admin-Token", adminToken.trim());

  // Only set JSON content-type when we actually send a body
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return apiFetch<T>(path, { ...init, headers });
}
