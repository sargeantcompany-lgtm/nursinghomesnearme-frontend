const rawApiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

export const API_BASE = rawApiBase ? rawApiBase.replace(/\/$/, "") : "";

export const TOKEN_ENV = "";
