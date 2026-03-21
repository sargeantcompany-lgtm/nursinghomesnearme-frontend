function normalizeApiBase(value?: string): string {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/$/, "");
}

function detectApiBase(): string {
  const fromEnv = normalizeApiBase(import.meta.env.VITE_API_BASE_URL as string | undefined);
  if (fromEnv) return fromEnv;

  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    if (host === "www.nursinghomesnearme.com.au" || host === "nursinghomesnearme.com.au") {
      return "https://nursinghomesnearmebackend-production.up.railway.app";
    }
  }

  return "";
}

export const API_BASE = detectApiBase();

export const TOKEN_ENV = "";
