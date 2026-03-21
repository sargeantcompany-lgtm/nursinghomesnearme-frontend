import { API_BASE } from "./runtimeConfig";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      credentials: init?.credentials ?? "include",
      signal: init?.signal ?? controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
    }

    if (res.status === 204) return undefined as T;

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return (await res.json()) as T;
    }

    const text = await res.text();
    return text as unknown as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function adminFetch<T>(
  path: string,
  adminToken: string,
  init?: RequestInit
): Promise<T> {
  const headers = new Headers(init?.headers || {});
  const trimmedToken = adminToken.trim();
  if (trimmedToken && trimmedToken !== "cookie-session") {
    headers.set("X-Admin-Token", trimmedToken);
  }

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return apiFetch<T>(path, { ...init, headers, credentials: "include" });
}
