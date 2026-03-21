import "dotenv/config";

function readEnv(name, fallback = "") {
  return (process.env[name] ?? fallback).trim();
}

function readFirst(names, fallback = "") {
  for (const name of names) {
    const value = readEnv(name);
    if (value) return value;
  }
  return fallback;
}

function parseOrigins(value) {
  const baseOrigins = String(value || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const expanded = new Set();
  for (const origin of baseOrigins) {
    expanded.add(origin);
    try {
      const url = new URL(origin);
      if (url.hostname.startsWith("www.")) {
        expanded.add(`${url.protocol}//${url.hostname.slice(4)}`);
      } else if (!url.hostname.endsWith(".railway.app")) {
        expanded.add(`${url.protocol}//www.${url.hostname}`);
      }
    } catch {
      // Ignore malformed origins here; validation happens where origins are used.
    }
  }

  return [...expanded];
}

export const env = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: readEnv("NODE_ENV", "development"),
  databaseUrl: readFirst(["DATABASE_URL"]),
  appSecret: readFirst(["APP_SECRET", "ADMIN_TOKEN"]),
  adminPassword: readFirst(["ADMIN_PASSWORD", "APP_ADMIN_PASSWORD"]),
  siteUrl: readFirst(["SITE_URL", "APP_PUBLIC_BASE_URL"], "http://localhost:3000"),
  apiBaseUrl: readFirst(["APP_PUBLIC_API_BASE_URL"], "http://localhost:3000"),
  clientLoginFromEmail: readFirst(["CLIENT_LOGIN_FROM_EMAIL", "SPRING_MAIL_USERNAME", "APP_ADMIN_NOTIFY_EMAIL"]),
  resendApiKey: readEnv("RESEND_API_KEY"),
  allowedOrigin: readFirst(["ALLOWED_ORIGIN", "APP_PUBLIC_BASE_URL"]),
  allowedOrigins: parseOrigins(readFirst(["ALLOWED_ORIGIN", "APP_PUBLIC_BASE_URL"])),
  smtpHost: readFirst(["SMTP_HOST", "SPRING_MAIL_HOST"]),
  smtpPort: Number(readFirst(["SMTP_PORT", "SPRING_MAIL_PORT"], "465")),
  smtpUser: readFirst(["SMTP_USER", "SPRING_MAIL_USERNAME"]),
  smtpPass: readFirst(["SMTP_PASS", "SPRING_MAIL_PASSWORD"]),
  smtpAuth: readFirst(["SMTP_AUTH", "SPRING_MAIL_SMTP_AUTH"], "true") === "true",
  smtpSsl: readFirst(["SMTP_SSL", "SPRING_MAIL_SMTP_SSL_ENABLE"], "true") === "true",
  smtpStartTls: readFirst(["SMTP_STARTTLS", "SPRING_MAIL_SMTP_STARTTLS_ENABLE"], "false") === "true",
  adminNotifyEmail: readFirst(["APP_ADMIN_NOTIFY_EMAIL", "SPRING_MAIL_USERNAME"]),
  firecrawlApiKey: readEnv("FIRECRAWL_API_KEY"),
  uploadsDir: readFirst(["UPLOADS_DIR", "APP_UPLOAD_DIR"], "uploads"),
};

if (!env.databaseUrl) {
  console.warn("[server] DATABASE_URL is not set. API startup will fail until Postgres is configured.");
}

if (!env.appSecret) {
  throw new Error("[server] APP_SECRET or ADMIN_TOKEN must be set.");
}

if (!env.adminPassword) {
  throw new Error("[server] ADMIN_PASSWORD or APP_ADMIN_PASSWORD must be set.");
}

const insecureSecretPattern = /(change-this|change-me|dev-only|test)/i;
if (env.nodeEnv === "production") {
  if (insecureSecretPattern.test(env.appSecret)) {
    throw new Error("[server] APP_SECRET/ADMIN_TOKEN looks insecure for production. Rotate it before deploy.");
  }
  if (insecureSecretPattern.test(env.adminPassword)) {
    throw new Error("[server] ADMIN_PASSWORD looks insecure for production. Rotate it before deploy.");
  }
}
