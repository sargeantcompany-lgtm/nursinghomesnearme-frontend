import fs from "fs";
import path from "path";
import crypto from "crypto";
import tls from "tls";
import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "url";
import { env } from "./env.mjs";
import { query } from "./db.mjs";
import { runMigrations } from "./migrate.mjs";
import { blogPosts } from "./blogData.mjs";
import { registerCareCircleRoutes } from "./carecircle.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const uploadsDir = path.isAbsolute(env.uploadsDir)
  ? env.uploadsDir
  : path.join(projectRoot, env.uploadsDir);
const uploadsFacilitiesDir = path.join(uploadsDir, "facilities");

const app = express();
app.set("trust proxy", 1);

function getRequestIp(req) {
  return (req.ip || req.socket?.remoteAddress || "unknown").trim();
}

function cleanupRateLimitStore(store, now, windowMs) {
  for (const [key, entry] of store.entries()) {
    if (now - entry.windowStart >= windowMs) {
      store.delete(key);
    }
  }
}

function createRateLimiter({ windowMs, max, message, keyPrefix }) {
  const store = new Map();

  return function rateLimiter(req, res, next) {
    const now = Date.now();
    cleanupRateLimitStore(store, now, windowMs);

    const bucketKey = `${keyPrefix}:${getRequestIp(req)}`;
    const current = store.get(bucketKey);
    if (!current || now - current.windowStart >= windowMs) {
      store.set(bucketKey, { count: 1, windowStart: now });
      return next();
    }

    if (current.count >= max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((current.windowStart + windowMs - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({ message });
    }

    current.count += 1;
    return next();
  };
}

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (env.nodeEnv !== "production") return true;
  return env.allowedOrigins.includes(origin);
}

const adminLoginRateLimit = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: "Too many admin login attempts. Please try again later.",
  keyPrefix: "admin-login",
});

const workflowLoginLinkRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 6,
  message: "Too many dashboard link requests. Please try again later.",
  keyPrefix: "workflow-link",
});

const workflowAuthRateLimit = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 12,
  message: "Too many workflow authentication attempts. Please try again later.",
  keyPrefix: "workflow-auth",
});

const intakeRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: "Too many placement requests from this connection. Please try again later.",
  keyPrefix: "placement-intake",
});

const enquiryRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: "Too many enquiry submissions from this connection. Please try again later.",
  keyPrefix: "chat-enquiry",
});

const facilityLoginRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 6,
  message: "Too many facility login requests. Please try again later.",
  keyPrefix: "facility-link",
});

const adminUploadRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many upload attempts. Please try again later.",
  keyPrefix: "admin-upload",
});

// Redirect non-www to www in production
app.use((req, res, next) => {
  if (req.hostname === "nursinghomesnearme.com.au") {
    return res.redirect(301, `https://www.nursinghomesnearme.com.au${req.originalUrl}`);
  }
  next();
});

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
fs.mkdirSync(uploadsDir, { recursive: true });
fs.mkdirSync(uploadsFacilitiesDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));
app.use((error, _req, res, next) => {
  if (error?.message?.startsWith("CORS blocked")) {
    return res.status(403).json({ message: "Origin not allowed." });
  }
  return next(error);
});
app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    console.log(`[http] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms ip=${getRequestIp(req)}`);
  });
  next();
});
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  if (req.secure || String(req.header("x-forwarded-proto") || "").includes("https")) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

function signAdminToken() {
  return jwt.sign({ role: "admin" }, env.appSecret, { expiresIn: "12h" });
}

function signClientAuthToken(clientCaseId, publicToken) {
  return jwt.sign({ role: "client", clientCaseId, publicToken }, env.appSecret, { expiresIn: "7d" });
}

function signFacilityMatchToken(clientCaseId, nursingHomeId) {
  return jwt.sign({ role: "facility_match", clientCaseId, nursingHomeId }, env.appSecret, { expiresIn: "7d" });
}

function signFacilitySessionToken(nursingHomeId) {
  return jwt.sign({ role: "facility", nursingHomeId }, env.appSecret, { expiresIn: "12h" });
}

function verifyToken(token) {
  return jwt.verify(token, env.appSecret);
}

function getCookie(req, name) {
  const cookieHeader = String(req.header("Cookie") || "");
  const parts = cookieHeader.split(/;\s*/);
  for (const part of parts) {
    const [key, ...rest] = part.split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

function setCookie(res, name, value, maxAgeSeconds) {
  const secure = env.nodeEnv === "production";
  const sameSite = secure ? "None" : "Lax";
  const cookie = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    `SameSite=${sameSite}`,
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (secure) cookie.push("Secure");
  res.append("Set-Cookie", cookie.join("; "));
}

function clearCookie(res, name) {
  const secure = env.nodeEnv === "production";
  const sameSite = secure ? "None" : "Lax";
  const cookie = [
    `${name}=`,
    "Path=/",
    "HttpOnly",
    `SameSite=${sameSite}`,
    "Max-Age=0",
  ];
  if (secure) cookie.push("Secure");
  res.append("Set-Cookie", cookie.join("; "));
}

function hasTrustedOrigin(req) {
  const allowed = new Set(
    [...env.allowedOrigins, env.siteUrl]
      .map((value) => {
        try {
          return new URL(value).origin;
        } catch {
          return "";
        }
      })
      .filter(Boolean),
  );
  const originHeader = String(req.header("Origin") || "").trim();
  if (originHeader) return allowed.has(originHeader);

  const refererHeader = String(req.header("Referer") || "").trim();
  if (refererHeader) {
    try {
      return allowed.has(new URL(refererHeader).origin);
    } catch {
      return false;
    }
  }
  return env.nodeEnv !== "production";
}

function adminAuth(req, res, next) {
  const token = (req.header("X-Admin-Token") || getCookie(req, "nhnm_admin_session") || "").trim();
  if (!token) return res.status(401).json({ message: "Missing admin token." });
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method.toUpperCase()) && !hasTrustedOrigin(req)) {
    return res.status(403).json({ message: "Untrusted origin." });
  }
  try {
    const decoded = verifyToken(token);
    if (decoded.role !== "admin") throw new Error("Bad role");
    next();
  } catch {
    return res.status(401).json({ message: "Invalid admin token." });
  }
}

function createPublicToken() {
  return crypto.randomBytes(18).toString("base64url");
}

function createFacilityToken() {
  return crypto.randomBytes(24).toString("base64url");
}

function parseMaybeDate(value) {
  const trimmed = String(value ?? "").trim();
  return trimmed ? trimmed : null;
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

function cleanText(value, maxLength = 5000) {
  return String(value || "").trim().slice(0, maxLength);
}

function sanitizeFilename(filename) {
  const ext = path.extname(String(filename || "")).toLowerCase();
  const stem = path
    .basename(String(filename || ""), ext)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return { stem: stem || "upload", ext };
}

function extForMime(mime) {
  switch (mime) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    default:
      return "";
  }
}

function extForRemoteUrl(value = "") {
  try {
    const pathname = new URL(value).pathname || "";
    const ext = path.extname(pathname).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) return ext;
  } catch {
    // Ignore invalid URLs here.
  }
  return "";
}

function filenameStemFromUrl(value = "", fallback = "facility-image") {
  try {
    const pathname = new URL(value).pathname || "";
    const stem = path.basename(pathname, path.extname(pathname));
    const clean = sanitizeFilename(stem).stem;
    return clean || fallback;
  } catch {
    return fallback;
  }
}

function normalizeStoredImageUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return "";
  if (value.startsWith("/")) return value;

  const uploadsIdx = value.toLowerCase().indexOf("/uploads/");
  if (uploadsIdx >= 0) return value.slice(uploadsIdx);

  const publicIdx = value.toLowerCase().indexOf("/public/");
  if (publicIdx >= 0) return value.slice(publicIdx + "/public".length);

  return value;
}

async function mirrorRemoteImageUrl(rawUrl, { folder = "facilities", fallbackStem = "facility-image" } = {}) {
  const sourceUrl = String(rawUrl || "").trim();
  if (!sourceUrl) return "";

  const normalizedExisting = normalizeStoredImageUrl(sourceUrl);
  if (normalizedExisting.startsWith("/uploads/") || normalizedExisting.startsWith("/facility-gallery/")) {
    return normalizedExisting;
  }

  let url;
  try {
    url = new URL(sourceUrl);
  } catch {
    return sourceUrl;
  }

  if (!/^https?:$/i.test(url.protocol)) {
    return sourceUrl;
  }

  const response = await fetch(url, {
    headers: {
      "user-agent": "nursinghomesnearme-backend/1.0",
      accept: "image/avif,image/webp,image/png,image/jpeg,*/*;q=0.8",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Image download failed (${response.status}) for ${sourceUrl}`);
  }

  const contentType = String(response.headers.get("content-type") || "").toLowerCase();
  const mimeType = contentType.split(";")[0].trim();
  const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!allowedMimeTypes.has(mimeType)) {
    throw new Error(`Unsupported remote image type: ${contentType || "unknown"}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (!buffer.length) {
    throw new Error(`Remote image was empty: ${sourceUrl}`);
  }
  if (buffer.length > 10 * 1024 * 1024) {
    throw new Error(`Remote image exceeded 10MB: ${sourceUrl}`);
  }

  const ext = extForRemoteUrl(sourceUrl) || extForMime(mimeType);
  if (!ext) {
    throw new Error(`Could not determine file extension for ${sourceUrl}`);
  }

  const safeStem = filenameStemFromUrl(sourceUrl, fallbackStem);
  const folderRelative = folder.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  const targetDir = folderRelative ? path.join(uploadsDir, folderRelative) : uploadsDir;
  await fs.promises.mkdir(targetDir, { recursive: true });

  const finalName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${safeStem}${ext}`;
  const targetPath = path.join(targetDir, finalName);
  await fs.promises.writeFile(targetPath, buffer);

  return folderRelative ? `/uploads/${folderRelative}/${finalName}` : `/uploads/${finalName}`;
}

async function readMultipartUpload(req, maxBytes = 8 * 1024 * 1024) {
  const contentType = String(req.headers["content-type"] || "");
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  if (!boundaryMatch) {
    throw new Error("Expected multipart/form-data upload.");
  }
  const boundary = boundaryMatch[1] || boundaryMatch[2];
  const chunks = [];
  let total = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > maxBytes) {
      throw new Error("Upload exceeds the 8MB size limit.");
    }
    chunks.push(buffer);
  }

  const body = Buffer.concat(chunks);
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const headerSeparator = Buffer.from("\r\n\r\n");
  const fileFieldName = 'name="file"';
  let searchIndex = 0;

  while (searchIndex < body.length) {
    const boundaryIndex = body.indexOf(boundaryBuffer, searchIndex);
    if (boundaryIndex === -1) break;
    const headerStart = boundaryIndex + boundaryBuffer.length + 2;
    const headerEnd = body.indexOf(headerSeparator, headerStart);
    if (headerEnd === -1) break;

    const headerText = body.subarray(headerStart, headerEnd).toString("utf8");
    if (!headerText.includes(fileFieldName)) {
      searchIndex = headerEnd + headerSeparator.length;
      continue;
    }

    const filenameMatch = /filename="([^"]*)"/i.exec(headerText);
    const mimeMatch = /content-type:\s*([^\r\n]+)/i.exec(headerText);
    const contentStart = headerEnd + headerSeparator.length;
    const nextBoundaryIndex = body.indexOf(Buffer.from(`\r\n--${boundary}`), contentStart);
    if (nextBoundaryIndex === -1) {
      throw new Error("Malformed upload payload.");
    }

    return {
      filename: filenameMatch?.[1] || "upload",
      mimeType: (mimeMatch?.[1] || "").trim().toLowerCase(),
      buffer: body.subarray(contentStart, nextBoundaryIndex),
    };
  }

  throw new Error("No file field found in upload.");
}

function toJsonArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueTrimmed(list) {
  const next = [];
  for (const item of Array.isArray(list) ? list : []) {
    const value = String(item || "").trim();
    if (!value || next.includes(value)) continue;
    next.push(value);
  }
  return next;
}

function hasMeaningfulRoomOptions(value) {
  return toJsonArray(value).some((room) => {
    if (!room || typeof room !== "object") return false;
    return [
      room.roomType,
      room.roomName,
      room.bathroomType,
      room.sizeM2,
      room.sizeText,
      room.radMin,
      room.radMax,
      room.dapAmount,
      room.availabilityNote,
    ].some((field) => String(field ?? "").trim());
  });
}

function getFacilityGapInfo(row) {
  const hasWebsite = !!String(row.website || "").trim();
  const hasGovUrl = !!String(row.government_listing_url || "").trim();
  const missing = [];

  if (!String(row.one_line_description || "").trim()) missing.push({ label: "Summary", source: "Web" });
  if (!String(row.description || "").trim()) missing.push({ label: "Description", source: "Web" });
  if (!String(row.phone || "").trim()) missing.push({ label: "Phone", source: "Web" });
  if (!String(row.email || "").trim()) missing.push({ label: "Email", source: "Web" });
  if (!String(row.address_line1 || "").trim()) missing.push({ label: "Address", source: "Web" });
  if (!toJsonArray(row.feature_tags).length && !toJsonArray(row.other_tags).length) missing.push({ label: "Tags", source: "Web" });
  if (!toJsonArray(row.languages).length) missing.push({ label: "Languages", source: "Web" });
  if (!String(row.primary_image_url || "").trim()) missing.push({ label: "Primary image", source: "Manual" });
  if (!toJsonArray(row.gallery_image_urls).length) missing.push({ label: "Gallery images", source: "Manual" });
  if (!hasMeaningfulRoomOptions(row.room_options)) missing.push({ label: "Rooms & pricing", source: "Gov" });
  if (normalizeVacancyValue(row.website_says_vacancies) === "unknown") missing.push({ label: "Vacancy status", source: "Web" });

  return {
    missingFields: missing.map((item) => item.label),
    missingDetails: missing,
    scanSources: uniqueTrimmed(missing.map((item) => item.source)),
    hasWebsite,
    hasGovUrl,
  };
}

function rowToAdminListItem(row) {
  const gapInfo = getFacilityGapInfo(row);
  return {
    id: Number(row.id),
    name: row.name,
    facilityRowId: row.facility_row_id,
    providerName: row.provider_name,
    oneLineDescription: row.one_line_description,
    suburb: row.suburb,
    state: row.state,
    postcode: row.postcode,
    latitude: row.latitude,
    longitude: row.longitude,
    status: row.status,
    primaryImageUrl: row.primary_image_url,
    phone: row.phone,
    email: row.email,
    website: row.website,
    websiteSaysVacancies: row.website_says_vacancies,
    facilityConfirmedVacancies: row.facility_confirmed_vacancies,
    websiteCheckedAt: row.website_checked_at,
    facilityConfirmedAt: row.facility_confirmed_at,
    conflictFlag: row.conflict_flag,
    lastOutreachSentAt: row.last_outreach_sent_at,
    lastOutreachReplyAt: row.last_outreach_reply_at,
    canReceiveWeeklyCheck: !!row.email,
    hasWebsite: gapInfo.hasWebsite,
    hasGovUrl: gapInfo.hasGovUrl,
    missingFields: gapInfo.missingFields,
    missingDetails: gapInfo.missingDetails,
    scanSources: gapInfo.scanSources,
  };
}

function rowToAdminNursingHome(row) {
  return {
    id: Number(row.id),
    name: row.name,
    oneLineDescription: row.one_line_description,
    description: row.description,
    addressLine1: row.address_line1,
    suburb: row.suburb,
    state: row.state,
    postcode: row.postcode,
    latitude: row.latitude,
    longitude: row.longitude,
    phone: row.phone,
    website: row.website,
    governmentListingUrl: row.government_listing_url,
    websiteSaysVacancies: row.website_says_vacancies,
    facilityConfirmedVacancies: row.facility_confirmed_vacancies,
    websiteCheckedAt: row.website_checked_at,
    websiteSourceUrl: row.website_source_url,
    facilityConfirmedAt: row.facility_confirmed_at,
    facilityConfirmationSource: row.facility_confirmation_source,
    conflictFlag: row.conflict_flag,
    lastProfileScanAt: row.last_profile_scan_at,
    updatedAt: row.updated_at,
    email: row.email,
    facebookUrl: row.facebook_url,
    instagramUrl: row.instagram_url,
    internalNotes: row.internal_notes,
    status: row.status,
    activeVacancies: row.active_vacancies,
    verifiedAt: row.verified_at,
    primaryImageUrl: row.primary_image_url,
    galleryImageUrls: toJsonArray(row.gallery_image_urls),
    featureTags: toJsonArray(row.feature_tags),
    otherTags: toJsonArray(row.other_tags),
    languages: toJsonArray(row.languages),
    roomOptions: toJsonArray(row.room_options),
  };
}

async function persistFacilityImageFields(body) {
  const primaryImageUrl = await mirrorRemoteImageUrl(body?.primaryImageUrl, {
    folder: "facilities",
    fallbackStem: "facility-primary",
  });

  const nextGallery = [];
  for (const item of toJsonArray(body?.galleryImageUrls)) {
    try {
      const mirrored = await mirrorRemoteImageUrl(item, {
        folder: "facilities",
        fallbackStem: "facility-gallery",
      });
      if (mirrored && !nextGallery.includes(mirrored)) {
        nextGallery.push(mirrored);
      }
    } catch (error) {
      console.warn("Skipping gallery image that could not be mirrored", {
        url: String(item || ""),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    ...body,
    primaryImageUrl,
    galleryImageUrls: nextGallery,
  };
}

function parseTagsFromHome(row) {
  return [...toJsonArray(row.feature_tags), ...toJsonArray(row.other_tags)]
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function normalizeLocationName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function publicHomeListItem(row, distanceKm = null) {
  return {
    id: Number(row.id),
    name: row.name,
    suburb: row.suburb,
    state: row.state,
    postcode: row.postcode,
    website: row.website,
    tags: parseTagsFromHome(row).join(", "),
    primaryImageUrl: row.primary_image_url,
    oneLineDescription: row.one_line_description,
    availabilityStatus:
      row.active_vacancies == null ? null : row.active_vacancies > 0 ? "available" : "waitlist",
    distanceKm,
  };
}

function publicHomeDetails(row) {
  return {
    id: Number(row.id),
    name: row.name,
    addressLine1: row.address_line1,
    suburb: row.suburb,
    state: row.state,
    postcode: row.postcode,
    website: row.website,
    tags: parseTagsFromHome(row).join(", "),
    primaryImageUrl: row.primary_image_url,
    oneLineDescription: row.one_line_description,
  };
}

function getResidentialIntake(payload) {
  const raw = payload?.residentialIntake;
  return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
}

function rowToCase(row) {
  const residentialIntake = row.residential_intake || {};
  return {
    id: Number(row.id),
    publicToken: row.public_token,
    enquiryId: row.enquiry_id,
    clientEmail: row.client_email,
    clientName: row.client_name,
    clientSuburb: row.client_suburb,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    preferredSuburbArea: row.preferred_suburb_area,
    timing: row.timing,
    currentLocation: row.current_location,
    dischargeDate: row.discharge_date,
    placementNeed: row.placement_need,
    patientName: row.patient_name,
    relationshipToPatient: row.relationship_to_patient,
    placementForName: row.placement_for_name,
    placementForDob: row.placement_for_dob,
    placementForRelation: row.placement_for_relation,
    gender: row.gender,
    maritalStatus: row.marital_status,
    pensionStatus: row.pension_status,
    livingSituation: row.living_situation,
    ownHome: row.own_home,
    someoneLivingInHome: row.someone_living_in_home,
    whoLivingInHome: row.who_living_in_home,
    haveHadAcat: row.have_had_acat,
    acatApprovedFor: row.acat_approved_for,
    mobility: row.mobility,
    cognition: row.cognition,
    behaviours: row.behaviours,
    continence: row.continence,
    otherConcerns: row.other_concerns,
    notes: row.notes,
    radRange: row.rad_range || row.budget_range,
    paymentPreference: row.payment_preference || row.funding_plan,
    govtHelpAccommodation: row.govt_help_accommodation,
    meansTested: row.means_tested || row.waiting_list_preference,
    fundingNotes: row.funding_notes,
    consentToShare: row.consent_to_share,
    residentialIntake,
    preferredHomes: residentialIntake.preferredHomes ?? "",
    hospitalWard: residentialIntake.hospitalWard ?? "",
    residentialPermanentApproved: residentialIntake.residentialPermanentApproved ?? "",
    myAgedCareReferralCode: residentialIntake.myAgedCareReferralCode ?? "",
    hasEpoa: residentialIntake.hasEpoa ?? "",
    qcatOrder: residentialIntake.qcatOrder ?? "",
    qcatCaseNumber: residentialIntake.qcatCaseNumber ?? "",
    memorySupportRequired: residentialIntake.memorySupportRequired ?? "",
    advanceHealthDirective: residentialIntake.advanceHealthDirective ?? "",
    ndisPlan: residentialIntake.ndisPlan ?? "",
    supportAtHome: residentialIntake.supportAtHome ?? "",
    supportAtHomeStartDate: residentialIntake.supportAtHomeStartDate ?? "",
    pensionType: residentialIntake.pensionType ?? "",
    pensionOrDvaNumber: residentialIntake.pensionOrDvaNumber ?? "",
    medicareNumber: residentialIntake.medicareNumber ?? "",
    sa457Sa485Status: residentialIntake.sa457Sa485Status ?? "",
    estimatedAnnualIncome: residentialIntake.estimatedAnnualIncome ?? "",
    homeHasSpouseOrDependent: residentialIntake.homeHasSpouseOrDependent ?? "",
    carerInHomeTwoYears: residentialIntake.carerInHomeTwoYears ?? "",
    closeFamilyCarerFiveYears: residentialIntake.closeFamilyCarerFiveYears ?? "",
    correspondenceRecipient: residentialIntake.correspondenceRecipient ?? "",
    internalCaseNotes: row.internal_case_notes,
    active: row.active,
    fullList: Array.isArray(row.full_list) ? row.full_list : [],
    shortList: Array.isArray(row.short_list) ? row.short_list : [],
  };
}

function buildNextSteps(row) {
  const steps = [
    "We have your enquiry and are reviewing the best available options.",
    "Check your dashboard regularly for updates and matched facilities.",
  ];
  if (!row.password_hash) {
    steps.unshift("Set a dashboard password so you can securely manage your case.");
  }
  return steps;
}

function rowToWorkflowSnapshot(row, authenticated) {
  const careTypes = Array.isArray(row.care_types) ? row.care_types.filter(Boolean).join(", ") : "";
  const residentialIntake = row.residential_intake || {};
  return {
    clientId: Number(row.id),
    clientToken: row.public_token,
    dashboardPasswordSet: !!row.password_hash,
    authenticated,
    contactName: row.contact_name || "",
    email: row.client_email || "",
    phone: row.contact_phone || "",
    preferredArea: row.preferred_suburb_area || row.client_suburb || "",
    timing: row.timing || "",
    careType: careTypes,
    fundingPlan: row.funding_plan || "",
    budgetRange: row.budget_range || "",
    acatNumber: row.acat_number || row.my_aged_care_referral_code || "",
    waitingListPreference: row.waiting_list_preference || "",
    notes: row.notes || "",
    placementForName: row.placement_for_name || row.patient_name || "",
    placementForDob: row.placement_for_dob || "",
    placementForRelation: row.placement_for_relation || row.relationship_to_patient || "",
    residentialIntake,
    preferredHomes: residentialIntake.preferredHomes || "",
    currentLocation: residentialIntake.currentLocation || row.current_location || "",
    hospitalWard: residentialIntake.hospitalWard || "",
    residentialPermanentApproved: residentialIntake.residentialPermanentApproved || "",
    myAgedCareReferralCode: residentialIntake.myAgedCareReferralCode || "",
    hasEpoa: residentialIntake.hasEpoa || "",
    qcatOrder: residentialIntake.qcatOrder || "",
    qcatCaseNumber: residentialIntake.qcatCaseNumber || "",
    memorySupportRequired: residentialIntake.memorySupportRequired || "",
    advanceHealthDirective: residentialIntake.advanceHealthDirective || "",
    ndisPlan: residentialIntake.ndisPlan || "",
    supportAtHome: residentialIntake.supportAtHome || "",
    supportAtHomeStartDate: residentialIntake.supportAtHomeStartDate || "",
    pensionType: residentialIntake.pensionType || "",
    pensionOrDvaNumber: residentialIntake.pensionOrDvaNumber || "",
    medicareNumber: residentialIntake.medicareNumber || "",
    sa457Sa485Status: residentialIntake.sa457Sa485Status || "",
    estimatedAnnualIncome: residentialIntake.estimatedAnnualIncome || "",
    homeHasSpouseOrDependent: residentialIntake.homeHasSpouseOrDependent || "",
    carerInHomeTwoYears: residentialIntake.carerInHomeTwoYears || "",
    closeFamilyCarerFiveYears: residentialIntake.closeFamilyCarerFiveYears || "",
    correspondenceRecipient: residentialIntake.correspondenceRecipient || "",
    approvalStatus: row.approval_status || "pending",
    lastWorkflowStage: row.last_workflow_stage || "intake_received",
    homeCareReferralPending: !!row.home_care_referral_pending,
    propertySupportPending: !!row.property_support_pending,
    nextSteps: buildNextSteps(row),
    matches: [],
  };
}

async function findCaseByToken(publicToken) {
  const result = await query("SELECT * FROM client_cases WHERE public_token = $1", [publicToken]);
  return result.rows[0] || null;
}

async function findLocationCentersByNames(names) {
  const cleaned = names.map((name) => normalizeLocationName(name)).filter(Boolean);
  if (!cleaned.length) return [];
  const result = await query("SELECT * FROM suburb_location_centers");
  return result.rows.filter((row) => cleaned.includes(normalizeLocationName(row.suburb)));
}

async function buildCaseLists(preferredLocations) {
  const homeResult = await query(
    `SELECT * FROM nursing_homes
     WHERE UPPER(COALESCE(status, 'ACTIVE')) = 'ACTIVE'
     ORDER BY name ASC`,
  );
  const homes = homeResult.rows;
  if (!homes.length) return { shortList: [], fullList: [] };

  const centers = await findLocationCentersByNames(preferredLocations);
  const ranked = homes
    .map((row) => {
      let distanceKm = null;
      if (centers.length && row.latitude != null && row.longitude != null) {
        distanceKm = Math.min(
          ...centers.map((center) => haversineKm(center.latitude, center.longitude, row.latitude, row.longitude)),
        );
      } else if (preferredLocations.length) {
        const match = preferredLocations.some((location) =>
          normalizeLocationName(row.suburb).includes(normalizeLocationName(location)),
        );
        distanceKm = match ? 0 : 9999;
      }
      return { row, distanceKm };
    })
    .sort((a, b) => {
      const aDistance = a.distanceKm ?? 9999;
      const bDistance = b.distanceKm ?? 9999;
      if (aDistance !== bDistance) return aDistance - bDistance;
      return String(a.row.name || "").localeCompare(String(b.row.name || ""));
    });

  const fullList = ranked.slice(0, 12).map(({ row, distanceKm }) => publicHomeListItem(row, distanceKm));
  const shortList = ranked
    .filter(({ distanceKm }) => distanceKm == null || distanceKm <= 25 || distanceKm === 0)
    .slice(0, 3)
    .map(({ row, distanceKm }) => publicHomeListItem(row, distanceKm));

  return { shortList, fullList };
}

async function sendEmailViaResend({ to, subject, html }) {
  if (!env.resendApiKey || !env.clientLoginFromEmail) {
    return { deliveryStatus: "logged", providerMessageId: null };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.clientLoginFromEmail,
      to: [to],
      subject,
      html,
    }),
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json?.message || "Failed to send email with Resend.");
  }

  return {
    deliveryStatus: "sent",
    providerMessageId: json?.id || null,
  };
}

function buildSmtpLogin() {
  return Buffer.from(`\0${env.smtpUser}\0${env.smtpPass}`).toString("base64");
}

function readSmtpResponse(socket) {
  return new Promise((resolve, reject) => {
    let buffer = "";
    const onData = (chunk) => {
      buffer += chunk.toString("utf8");
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      if (!lines.length) return;
      const last = lines[lines.length - 1];
      if (/^\d{3} /.test(last)) {
        socket.off("data", onData);
        resolve(buffer);
      }
    };
    socket.on("data", onData);
    socket.once("error", reject);
  });
}

async function sendSmtpCommand(socket, command, expectedPrefix = "250") {
  if (command) {
    socket.write(`${command}\r\n`);
  }
  const response = await readSmtpResponse(socket);
  if (!response.startsWith(expectedPrefix)) {
    throw new Error(`SMTP command failed: ${command || "greeting"} -> ${response.trim()}`);
  }
  return response;
}

async function sendEmailViaSmtp({ to, subject, html }) {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) {
    return { deliveryStatus: "logged", providerMessageId: null };
  }

  const socket = tls.connect({
    host: env.smtpHost,
    port: env.smtpPort,
    servername: env.smtpHost,
    rejectUnauthorized: true,
  });

  await new Promise((resolve, reject) => {
    socket.once("secureConnect", resolve);
    socket.once("error", reject);
  });

  try {
    await sendSmtpCommand(socket, "", "220");
    await sendSmtpCommand(socket, `EHLO ${new URL(env.siteUrl).hostname}`, "250");
    if (env.smtpAuth) {
      await sendSmtpCommand(socket, "AUTH PLAIN", "334");
      await sendSmtpCommand(socket, buildSmtpLogin(), "235");
    }

    await sendSmtpCommand(socket, `MAIL FROM:<${env.clientLoginFromEmail}>`, "250");
    await sendSmtpCommand(socket, `RCPT TO:<${to}>`, "250");
    await sendSmtpCommand(socket, "DATA", "354");

    const plainText = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const message = [
      `From: ${env.clientLoginFromEmail}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      'Content-Type: text/html; charset="UTF-8"',
      "",
      html,
      "",
      `<!-- ${plainText} -->`,
      ".",
    ].join("\r\n");

    await sendSmtpCommand(socket, message, "250");
    await sendSmtpCommand(socket, "QUIT", "221");

    return {
      deliveryStatus: "sent",
      providerMessageId: null,
    };
  } finally {
    socket.end();
  }
}

async function logLoginLink(caseRow) {
  const linkUrl = `${env.siteUrl.replace(/\/$/, "")}/workflow/${caseRow.public_token}`;
  const subject = "Your Nursing Homes Near Me dashboard link";
  const html = `
    <p>Hello${caseRow.contact_name ? ` ${caseRow.contact_name}` : ""},</p>
    <p>Your dashboard is ready. Use the link below to access your case and set your password.</p>
    <p><a href="${linkUrl}">${linkUrl}</a></p>
    <p>If you did not request this, you can ignore this email.</p>
  `;

  let delivery = { deliveryStatus: "logged", providerMessageId: null };
  try {
    delivery = env.resendApiKey
      ? await sendEmailViaResend({
          to: caseRow.client_email,
          subject,
          html,
        })
      : await sendEmailViaSmtp({
          to: caseRow.client_email,
          subject,
          html,
        });
  } catch (error) {
    console.error("[email] login link send failed:", error);
  }

  await query(
    `INSERT INTO workflow_login_requests
      (client_case_id, email, link_url, delivery_status, provider_message_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [caseRow.id, caseRow.client_email, linkUrl, delivery.deliveryStatus, delivery.providerMessageId],
  );

  return {
    ok: true,
    deliveryStatus: delivery.deliveryStatus,
    previewUrl: delivery.deliveryStatus === "logged" ? linkUrl : undefined,
  };
}

async function logFacilityLoginLink(facilityRow) {
  const token = createFacilityToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const linkUrl = `${env.siteUrl.replace(/\/$/, "")}/facility/dashboard?token=${token}`;
  const subject = "Your Nursing Homes Near Me facility login link";
  const html = `
    <p>Hello${facilityRow.name ? ` ${facilityRow.name}` : ""},</p>
    <p>Your secure facility dashboard link is below. It expires in 24 hours.</p>
    <p><a href="${linkUrl}">${linkUrl}</a></p>
    <p>If you did not request this, you can ignore this email.</p>
  `;

  let delivery = { deliveryStatus: "logged", providerMessageId: null };
  try {
    delivery = env.resendApiKey
      ? await sendEmailViaResend({ to: facilityRow.email, subject, html })
      : await sendEmailViaSmtp({ to: facilityRow.email, subject, html });
  } catch (error) {
    console.error("[email] facility login link send failed:", error);
  }

  await query(
    `INSERT INTO facility_login_tokens (nursing_home_id, email, token, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [facilityRow.id, facilityRow.email, token, expiresAt.toISOString()],
  );

  return {
    ok: true,
    deliveryStatus: delivery.deliveryStatus,
    previewUrl: delivery.deliveryStatus === "logged" ? linkUrl : undefined,
    expiresAt: expiresAt.toISOString(),
  };
}

async function findFacilitySession(token) {
  const result = await query(
    `SELECT flt.*, nh.name, nh.suburb, nh.active_vacancies, nh.facility_confirmed_at
     FROM facility_login_tokens flt
     JOIN nursing_homes nh ON nh.id = flt.nursing_home_id
     WHERE flt.token = $1`,
    [token],
  );
  const row = result.rows[0];
  if (!row) return null;
  if (row.used_at || new Date(row.expires_at).getTime() < Date.now()) return null;
  return row;
}

async function requireFacilityAuth(req, res, next) {
  const header = String(req.header("Authorization") || "").trim();
  const match = /^Bearer\s+(.+)$/i.exec(header);
  const token = match?.[1]?.trim();
  if (!token) return res.status(401).json({ message: "Missing facility token." });
  try {
    const decoded = verifyToken(token);
    if (decoded.role !== "facility") throw new Error("Bad role");
    const result = await query(
      `SELECT id AS nursing_home_id, name, suburb, active_vacancies, facility_confirmed_at
       FROM nursing_homes
       WHERE id = $1`,
      [Number(decoded.nursingHomeId)],
    );
    const session = result.rows[0];
    if (!session) return res.status(401).json({ message: "Facility session is no longer valid." });
    req.facilitySession = session;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired facility token." });
  }
}

async function listFacilityCaseMatches(nursingHomeId) {
  const casesResult = await query(
    `SELECT id, client_name, contact_name, preferred_suburb_area, timing, care_types, created_at, full_list, short_list
     FROM client_cases
     WHERE active = TRUE
     ORDER BY created_at DESC`,
  );
  const responsesResult = await query(
    `SELECT client_case_id, vacancy_outcome, waitlist_status, facility_notes, responded_at
     FROM facility_match_responses
     WHERE nursing_home_id = $1`,
    [nursingHomeId],
  );
  const responseMap = new Map(
    responsesResult.rows.map((row) => [Number(row.client_case_id), row]),
  );

  return casesResult.rows
    .filter((row) => {
      const items = [...toJsonArray(row.full_list), ...toJsonArray(row.short_list)];
      return items.some((item) => Number(item?.id) === Number(nursingHomeId));
    })
    .map((row) => {
      const response = responseMap.get(Number(row.id));
      return {
        matchId: Number(row.id),
        caseId: Number(row.id),
        clientName: row.client_name || row.contact_name || "Enquiry",
        timing: row.timing || "",
        careTypes: Array.isArray(row.care_types) ? row.care_types.filter(Boolean).join(", ") : "",
        preferredSuburb: row.preferred_suburb_area || "",
        submittedAt: row.created_at,
        vacancyOutcome: response?.vacancy_outcome || null,
        facilityResponseStatus: response?.vacancy_outcome || "",
        waitlistStatus: response?.waitlist_status || "not_requested",
        facilityNotes: response?.facility_notes || null,
        matchResponseToken: signFacilityMatchToken(Number(row.id), Number(nursingHomeId)),
      };
    });
}

function getClientAuth(req, caseRow) {
  const token = (req.header("X-Client-Auth") || "").trim();
  if (!token) return false;
  try {
    const decoded = verifyToken(token);
    return decoded.role === "client" && Number(decoded.clientCaseId) === Number(caseRow.id) && decoded.publicToken === caseRow.public_token;
  } catch {
    return false;
  }
}

function requireClientAuth(req, res, caseRow) {
  if (!caseRow.password_hash) {
    return true;
  }
  const authed = getClientAuth(req, caseRow);
  if (!authed) {
    res.status(401).json({ message: "Client authentication required." });
    return false;
  }
  return true;
}

app.get("/api/health", async (_req, res) => {
  await query("SELECT 1");
  res.json({ ok: true });
});

app.post("/api/admin/auth/login", adminLoginRateLimit, async (req, res) => {
  const password = String(req.body?.password || "").trim();
  if (!password || password !== env.adminPassword) {
    console.warn(`[auth] failed admin login ip=${getRequestIp(req)}`);
    return res.status(401).json({ message: "Incorrect password." });
  }
  const token = signAdminToken();
  setCookie(res, "nhnm_admin_session", token, 12 * 60 * 60);
  return res.json({ ok: true, token });
});

app.post("/api/admin/auth/logout", (_req, res) => {
  clearCookie(res, "nhnm_admin_session");
  return res.status(204).end();
});

app.get("/api/admin/auth/session", adminAuth, (_req, res) => {
  return res.json({ ok: true });
});

app.post("/api/facility/auth/request-link", facilityLoginRateLimit, async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "A valid facility email is required." });
  }

  const result = await query(
    `SELECT id, name, email
     FROM nursing_homes
     WHERE LOWER(email) = LOWER($1)
     LIMIT 1`,
    [email],
  );
  const facility = result.rows[0];
  if (!facility) {
    console.warn(`[auth] failed facility link request email=${email} ip=${getRequestIp(req)}`);
    return res.status(404).json({ message: "No facility found for that email address." });
  }

  const delivery = await logFacilityLoginLink(facility);
  return res.json(delivery);
});

app.post("/api/facility/auth/exchange", async (req, res) => {
  const loginToken = cleanText(req.body?.token, 1000);
  if (!loginToken) return res.status(400).json({ message: "Facility login token is required." });

  const session = await findFacilitySession(loginToken);
  if (!session) return res.status(401).json({ message: "Invalid or expired facility login token." });

  await query(
    `UPDATE facility_login_tokens
     SET used_at = NOW()
     WHERE id = $1 AND used_at IS NULL`,
    [session.id],
  );

  const facilityToken = signFacilitySessionToken(Number(session.nursing_home_id));
  return res.json({
    ok: true,
    token: facilityToken,
    expiresAt: "",
    facility: {
      id: Number(session.nursing_home_id),
      name: session.name,
      suburb: session.suburb,
    },
  });
});

app.post("/api/workflow/placement-intake", intakeRateLimit, async (req, res) => {
  const body = req.body || {};
  const clientEmail = normalizeEmail(body.email);
  const contactName = cleanText(body.contactName, 200);
  const preferredLocations = Array.isArray(body.preferredLocations) ? body.preferredLocations.map((item) => cleanText(item, 120)).filter(Boolean).slice(0, 5) : [];
  const careTypes = Array.isArray(body.careTypes) ? body.careTypes.map((item) => cleanText(item, 80)).filter(Boolean).slice(0, 8) : [];

  if (!isValidEmail(clientEmail) || !contactName) {
    return res.status(400).json({ message: "Contact name and a valid email are required." });
  }

  const publicToken = createPublicToken();
  const generatedLists = await buildCaseLists(preferredLocations);
  const result = await query(
    `INSERT INTO client_cases (
      public_token, client_email, client_name, client_suburb, contact_name, contact_phone,
      preferred_suburb_area, timing, current_location, notes, consent_to_share,
      care_types, preferred_locations, funding_plan, budget_range, waiting_list_preference,
      support_at_home_status, acat_number, short_list, full_list
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11,
      $12::jsonb, $13::jsonb, $14, $15, $16,
      $17, $18, $19::jsonb, $20::jsonb
    ) RETURNING *`,
    [
      publicToken,
      clientEmail,
      contactName,
      String(body.suburb || preferredLocations[0] || "").trim() || null,
      contactName || null,
      cleanText(body.phone, 80) || null,
      preferredLocations.join(", ") || null,
      cleanText(body.timing, 120) || null,
      cleanText(body.currentLocation, 120) || null,
      cleanText(body.notes, 4000) || null,
      body.consentToShare ? "Yes" : "No",
      JSON.stringify(careTypes),
      JSON.stringify(preferredLocations),
      cleanText(body.fundingPlan, 160) || null,
      cleanText(body.budgetRange, 120) || null,
      cleanText(body.waitingListPreference, 160) || null,
      cleanText(body.supportAtHome, 120) || null,
      cleanText(body.acatNumber, 120) || null,
      JSON.stringify(generatedLists.shortList),
      JSON.stringify(generatedLists.fullList),
    ],
  );

  return res.status(201).json({
    ok: true,
    clientId: Number(result.rows[0].id),
    clientToken: publicToken,
  });
});

app.post("/api/workflow/request-login-link", workflowLoginLinkRateLimit, async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!isValidEmail(email)) return res.status(400).json({ message: "A valid email is required." });

  const result = await query(
    `SELECT * FROM client_cases
     WHERE LOWER(client_email) = LOWER($1)
     ORDER BY created_at DESC
     LIMIT 1`,
    [email],
  );
  const row = result.rows[0];
  if (!row) {
    console.warn(`[auth] failed workflow link request email=${email} ip=${getRequestIp(req)}`);
    return res.status(404).json({ message: "No client case found for that email yet." });
  }

  const delivery = await logLoginLink(row);
  return res.json(delivery);
});

app.post("/api/workflow/login", workflowAuthRateLimit, async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");
  if (!isValidEmail(email) || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const result = await query(
    `SELECT * FROM client_cases
     WHERE LOWER(client_email) = LOWER($1)
     ORDER BY created_at DESC
     LIMIT 1`,
    [email],
  );
  const row = result.rows[0];
  if (!row || !row.password_hash) {
    console.warn(`[auth] failed workflow login email=${email} ip=${getRequestIp(req)}`);
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) {
    console.warn(`[auth] failed workflow login email=${email} ip=${getRequestIp(req)}`);
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const authToken = signClientAuthToken(row.id, row.public_token);
  return res.json({
    token: row.public_token,
    authToken,
    expiresAt: "",
    snapshot: rowToWorkflowSnapshot(row, true),
  });
});

app.get("/api/my-options/:token", async (req, res) => {
  const row = await findCaseByToken(req.params.token);
  if (!row) return res.status(404).json({ message: "Options not found." });
  return res.json({
    clientName: row.client_name || row.contact_name || "",
    clientEmail: row.client_email || "",
    clientSuburb: row.client_suburb || row.preferred_suburb_area || "",
    fullList: toJsonArray(row.full_list),
    shortList: toJsonArray(row.short_list),
  });
});

app.get("/api/nursing-homes/suburb/:suburb", async (req, res) => {
  const suburb = String(req.params.suburb || "").trim();
  const result = await query(
    `SELECT * FROM nursing_homes
     WHERE UPPER(COALESCE(status, 'ACTIVE')) = 'ACTIVE'
       AND UPPER(suburb) = UPPER($1)
     ORDER BY name ASC`,
    [suburb],
  );
  return res.json(result.rows.map((row) => publicHomeListItem(row)));
});

app.get("/api/nursing-homes", async (req, res) => {
  const suburbQuery = String(req.query.suburb || "").trim();
  const homesResult = await query(
    `SELECT * FROM nursing_homes
     WHERE UPPER(COALESCE(status, 'ACTIVE')) = 'ACTIVE'
     ORDER BY name ASC`,
  );
  const homes = homesResult.rows;

  if (!suburbQuery) {
    return res.json(homes.map((row) => publicHomeListItem(row)));
  }

  const centers = await findLocationCentersByNames([suburbQuery]);
  const ranked = homes
    .map((row) => {
      let distanceKm = null;
      if (centers.length && row.latitude != null && row.longitude != null) {
        distanceKm = Math.min(
          ...centers.map((center) => haversineKm(center.latitude, center.longitude, row.latitude, row.longitude)),
        );
      }
      return { row, distanceKm };
    })
    .sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));

  return res.json(ranked.map(({ row, distanceKm }) => publicHomeListItem(row, distanceKm)));
});

app.get("/api/nursing-homes/:id", async (req, res) => {
  const result = await query("SELECT * FROM nursing_homes WHERE id = $1", [req.params.id]);
  const row = result.rows[0];
  if (!row) return res.status(404).json({ message: "Facility not found." });
  return res.json(publicHomeDetails(row));
});

app.get("/api/facility/dashboard", requireFacilityAuth, async (req, res) => {
  const session = req.facilitySession;
  const matches = await listFacilityCaseMatches(session.nursing_home_id);
  return res.json({
    facility: {
      id: Number(session.nursing_home_id),
      name: session.name,
      suburb: session.suburb,
      availabilityStatus:
        session.active_vacancies == null ? null : Number(session.active_vacancies) > 0 ? "available" : "full",
      availabilityUpdatedAt: session.facility_confirmed_at || null,
    },
    matches,
  });
});

app.patch("/api/facility/availability", requireFacilityAuth, async (req, res) => {
  const session = req.facilitySession;
  const availabilityStatus = cleanText(req.body?.availabilityStatus, 40);
  const nextVacancies =
    availabilityStatus === "available" ? 1 : availabilityStatus === "waitlist" || availabilityStatus === "full" ? 0 : null;
  if (nextVacancies == null) {
    return res.status(400).json({ message: "availabilityStatus must be available, waitlist, or full." });
  }

  const updatedAt = new Date().toISOString();
  const result = await query(
    `UPDATE nursing_homes
     SET active_vacancies = $2,
         facility_confirmed_at = $3,
         facility_confirmed_vacancies = $4
     WHERE id = $1
     RETURNING id, active_vacancies, facility_confirmed_at, facility_confirmed_vacancies`,
    [
      session.nursing_home_id,
      nextVacancies,
      updatedAt,
      availabilityStatus === "available" ? "yes" : "no",
    ],
  );
  const row = result.rows[0];
  return res.json({
    id: Number(row.id),
    availabilityStatus,
    availabilityUpdatedAt: row.facility_confirmed_at,
  });
});

app.post("/api/facility/matches/:matchResponseToken/response", async (req, res) => {
  const token = cleanText(req.params.matchResponseToken, 1000);
  const vacancyOutcome = cleanText(req.body?.vacancyOutcome, 40);
  const waitlistStatus = cleanText(req.body?.waitlistStatus, 40) || "not_requested";
  const facilityNotes = cleanText(req.body?.facilityNotes, 4000) || null;
  const allowedOutcomes = ["vacancy", "no_vacancy", "waitlist_offered", "needs_more_info"];
  const allowedWaitlistStatuses = ["not_requested", "requested", "confirmed"];

  if (!allowedOutcomes.includes(vacancyOutcome)) {
    return res.status(400).json({ message: "Invalid vacancy outcome." });
  }
  if (!allowedWaitlistStatuses.includes(waitlistStatus)) {
    return res.status(400).json({ message: "Invalid waitlist status." });
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    return res.status(400).json({ message: "Invalid match token." });
  }
  if (decoded.role !== "facility_match") {
    return res.status(400).json({ message: "Invalid match token." });
  }
  const caseId = Number(decoded.clientCaseId);
  const nursingHomeId = Number(decoded.nursingHomeId);

  const caseResult = await query("SELECT id FROM client_cases WHERE id = $1", [caseId]);
  if (!caseResult.rows[0]) return res.status(404).json({ message: "Match not found." });

  await query(
    `INSERT INTO facility_match_responses
      (nursing_home_id, client_case_id, vacancy_outcome, waitlist_status, facility_notes, responded_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (nursing_home_id, client_case_id)
     DO UPDATE SET
       vacancy_outcome = EXCLUDED.vacancy_outcome,
       waitlist_status = EXCLUDED.waitlist_status,
       facility_notes = EXCLUDED.facility_notes,
       responded_at = NOW()`,
    [nursingHomeId, caseId, vacancyOutcome, waitlistStatus, facilityNotes],
  );

  return res.status(204).end();
});

app.get("/api/workflow/client/:token", async (req, res) => {
  const row = await findCaseByToken(req.params.token);
  if (!row) return res.status(404).json({ message: "Workflow not found." });
  return res.json(rowToWorkflowSnapshot(row, getClientAuth(req, row)));
});

app.post("/api/workflow/client/:token/set-password", workflowAuthRateLimit, async (req, res) => {
  const row = await findCaseByToken(req.params.token);
  if (!row) return res.status(404).json({ message: "Workflow not found." });

  const password = String(req.body?.password || "");
  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await query(
    `UPDATE client_cases
     SET password_hash = $2, last_workflow_stage = 'password_set'
     WHERE id = $1
     RETURNING *`,
    [row.id, passwordHash],
  );
  const updated = result.rows[0];
  const authToken = signClientAuthToken(updated.id, updated.public_token);
  return res.json({
    ok: true,
    authToken,
    expiresAt: "",
    snapshot: rowToWorkflowSnapshot(updated, true),
  });
});

app.post("/api/workflow/client/:token/login", workflowAuthRateLimit, async (req, res) => {
  const row = await findCaseByToken(req.params.token);
  if (!row) return res.status(404).json({ message: "Workflow not found." });
  if (!row.password_hash) {
    return res.status(400).json({ message: "Password has not been set yet." });
  }

  const password = String(req.body?.password || "");
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return res.status(401).json({ message: "Incorrect password." });

  const authToken = signClientAuthToken(row.id, row.public_token);
  return res.json({
    ok: true,
    authToken,
    expiresAt: "",
    snapshot: rowToWorkflowSnapshot(row, true),
  });
});

app.patch("/api/workflow/client/:token/profile", async (req, res) => {
  const row = await findCaseByToken(req.params.token);
  if (!row) return res.status(404).json({ message: "Workflow not found." });
  if (!requireClientAuth(req, res, row)) return;

  const body = req.body || {};
  const residentialIntake = getResidentialIntake(body);
  const result = await query(
    `UPDATE client_cases
     SET contact_name = COALESCE($2, contact_name),
         client_email = COALESCE($3, client_email),
         contact_phone = COALESCE($4, contact_phone),
         preferred_suburb_area = COALESCE($5, preferred_suburb_area),
         timing = COALESCE($6, timing),
         placement_for_name = COALESCE($7, placement_for_name),
         placement_for_dob = COALESCE($8, placement_for_dob),
         placement_for_relation = COALESCE($9, placement_for_relation),
         notes = COALESCE($10, notes),
         residential_intake = CASE
           WHEN $11::jsonb = '{}'::jsonb THEN residential_intake
           ELSE residential_intake || $11::jsonb
         END,
         funding_plan = COALESCE($12, funding_plan),
         budget_range = COALESCE($13, budget_range),
         acat_number = COALESCE($14, acat_number),
         waiting_list_preference = COALESCE($15, waiting_list_preference),
         last_workflow_stage = 'profile_updated'
     WHERE id = $1
     RETURNING *`,
    [
      row.id,
      String(body.contactName || "").trim() || null,
      String(body.email || "").trim().toLowerCase() || null,
      String(body.phone || "").trim() || null,
      String(body.preferredArea || "").trim() || null,
      String(body.timing || "").trim() || null,
      String(body.placementForName || "").trim() || null,
      parseMaybeDate(body.placementForDob),
      String(body.placementForRelation || "").trim() || null,
      String(body.notes || "").trim() || null,
      JSON.stringify(residentialIntake),
      String(body.fundingPlan || "").trim() || null,
      String(body.budgetRange || "").trim() || null,
      String(body.acatNumber || "").trim() || null,
      String(body.waitingListPreference || "").trim() || null,
    ],
  );

  return res.json(rowToWorkflowSnapshot(result.rows[0], true));
});

app.patch("/api/workflow/client/:token/matches/:matchId", async (req, res) => {
  const row = await findCaseByToken(req.params.token);
  if (!row) return res.status(404).json({ message: "Workflow not found." });
  if (!requireClientAuth(req, res, row)) return;
  return res.json(rowToWorkflowSnapshot(row, true));
});

app.post("/api/workflow/client/:token/submit-selections", async (req, res) => {
  const row = await findCaseByToken(req.params.token);
  if (!row) return res.status(404).json({ message: "Workflow not found." });
  if (!requireClientAuth(req, res, row)) return;
  const result = await query(
    `UPDATE client_cases
     SET last_workflow_stage = 'selections_submitted'
     WHERE id = $1
     RETURNING *`,
    [row.id],
  );
  return res.json(rowToWorkflowSnapshot(result.rows[0], true));
});

app.get("/api/admin/cases", adminAuth, async (_req, res) => {
  const result = await query(
    `SELECT id, public_token, client_email, client_name, client_suburb, active
     FROM client_cases
     ORDER BY id DESC`,
  );
  return res.json(
    result.rows.map((row) => ({
      id: Number(row.id),
      publicToken: row.public_token,
      clientEmail: row.client_email,
      clientName: row.client_name,
      clientSuburb: row.client_suburb,
      active: row.active,
    })),
  );
});

app.post("/api/admin/cases", adminAuth, async (req, res) => {
  const clientEmail = String(req.body?.clientEmail || "").trim().toLowerCase();
  if (!clientEmail) return res.status(400).json({ message: "Client email is required." });
  const publicToken = createPublicToken();
  const result = await query(
    `INSERT INTO client_cases (public_token, client_email, client_name, client_suburb, contact_name)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      publicToken,
      clientEmail,
      String(req.body?.clientName || "").trim() || null,
      String(req.body?.clientSuburb || "").trim() || null,
      String(req.body?.clientName || "").trim() || null,
    ],
  );
  const row = result.rows[0];
  return res.status(201).json({
    id: Number(row.id),
    publicToken: row.public_token,
    clientEmail: row.client_email,
    clientName: row.client_name,
    clientSuburb: row.client_suburb,
    active: row.active,
  });
});

app.get("/api/admin/cases/:id", adminAuth, async (req, res) => {
  const result = await query("SELECT * FROM client_cases WHERE id = $1", [req.params.id]);
  const row = result.rows[0];
  if (!row) return res.status(404).json({ message: "Case not found." });
  return res.json(rowToCase(row));
});

app.patch("/api/admin/cases/:id/file", adminAuth, async (req, res) => {
  const body = req.body || {};
  const result = await query(
    `UPDATE client_cases
     SET enquiry_id = $2,
         client_email = $3,
         client_name = $4,
         client_suburb = $5,
         contact_name = $6,
         contact_phone = $7,
         preferred_suburb_area = $8,
         timing = $9,
         current_location = $10,
         discharge_date = $11,
         placement_need = $12,
         patient_name = $13,
         relationship_to_patient = $14,
         placement_for_name = $15,
         placement_for_relation = $16,
         gender = $17,
         marital_status = $18,
         pension_status = $19,
         living_situation = $20,
         own_home = $21,
         someone_living_in_home = $22,
         who_living_in_home = $23,
         have_had_acat = $24,
         acat_approved_for = $25,
         mobility = $26,
         cognition = $27,
         behaviours = $28,
         continence = $29,
         other_concerns = $30,
         notes = $31,
         rad_range = $32,
         payment_preference = $33,
         govt_help_accommodation = $34,
         means_tested = $35,
         funding_notes = $36,
         consent_to_share = $37,
         residential_intake = $38::jsonb,
         internal_case_notes = $39,
         active = $40
     WHERE id = $1
     RETURNING *`,
    [
      req.params.id,
      body.enquiryId ?? null,
      String(body.clientEmail || "").trim().toLowerCase() || null,
      String(body.clientName || "").trim() || null,
      String(body.clientSuburb || "").trim() || null,
      String(body.contactName || "").trim() || null,
      String(body.contactPhone || "").trim() || null,
      String(body.preferredSuburbArea || "").trim() || null,
      String(body.timing || "").trim() || null,
      String(body.currentLocation || "").trim() || null,
      parseMaybeDate(body.dischargeDate),
      String(body.placementNeed || "").trim() || null,
      String(body.patientName || "").trim() || null,
      String(body.relationshipToPatient || "").trim() || null,
      String(body.placementForName || "").trim() || String(body.patientName || "").trim() || null,
      String(body.placementForRelation || "").trim() || String(body.relationshipToPatient || "").trim() || null,
      String(body.gender || "").trim() || null,
      String(body.maritalStatus || "").trim() || null,
      String(body.pensionStatus || "").trim() || null,
      String(body.livingSituation || "").trim() || null,
      String(body.ownHome || "").trim() || null,
      String(body.someoneLivingInHome || "").trim() || null,
      String(body.whoLivingInHome || "").trim() || null,
      String(body.haveHadAcat || "").trim() || null,
      String(body.acatApprovedFor || "").trim() || null,
      String(body.mobility || "").trim() || null,
      String(body.cognition || "").trim() || null,
      String(body.behaviours || "").trim() || null,
      String(body.continence || "").trim() || null,
      String(body.otherConcerns || "").trim() || null,
      String(body.notes || "").trim() || null,
      String(body.radRange || "").trim() || null,
      String(body.paymentPreference || "").trim() || null,
      String(body.govtHelpAccommodation || "").trim() || null,
      String(body.meansTested || "").trim() || null,
      String(body.fundingNotes || "").trim() || null,
      String(body.consentToShare || "").trim() || null,
      JSON.stringify(getResidentialIntake(body)),
      String(body.internalCaseNotes || "").trim() || null,
      body.active !== false,
    ],
  );
  const row = result.rows[0];
  if (!row) return res.status(404).json({ message: "Case not found." });
  return res.json(rowToCase(row));
});

async function sendAdminCaseEmail(caseRow, kind) {
  const subject = `Nursing Homes Near Me ${kind.toUpperCase()} list`;
  const html = `
    <p>Hello${caseRow.contact_name ? ` ${caseRow.contact_name}` : ""},</p>
    <p>Your ${kind.toUpperCase()} list is being prepared in the dashboard.</p>
    <p>Dashboard link: <a href="${env.siteUrl.replace(/\/$/, "")}/workflow/${caseRow.public_token}">${env.siteUrl.replace(/\/$/, "")}/workflow/${caseRow.public_token}</a></p>
  `;

  let delivery = { deliveryStatus: "logged", providerMessageId: null };
  try {
    delivery = env.resendApiKey
      ? await sendEmailViaResend({ to: caseRow.client_email, subject, html })
      : await sendEmailViaSmtp({ to: caseRow.client_email, subject, html });
  } catch (error) {
    console.error(`[email] ${kind} list send failed:`, error);
  }

  await query(
    `INSERT INTO outbound_messages
      (client_case_id, message_type, recipient_email, subject, delivery_status, provider_message_id, payload)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [
      caseRow.id,
      `case_${kind}`,
      caseRow.client_email,
      subject,
      delivery.deliveryStatus,
      delivery.providerMessageId,
      JSON.stringify({ publicToken: caseRow.public_token }),
    ],
  );
}

app.post("/api/admin/cases/:id/send-:kind", adminAuth, async (req, res) => {
  const kind = req.params.kind;
  if (kind !== "short" && kind !== "full") {
    return res.status(400).json({ message: "Unknown list type." });
  }

  const result = await query("SELECT * FROM client_cases WHERE id = $1", [req.params.id]);
  const row = result.rows[0];
  if (!row) return res.status(404).json({ message: "Case not found." });

  await sendAdminCaseEmail(row, kind);
  return res.status(204).send();
});

app.post("/api/admin/uploads", adminAuth, adminUploadRateLimit, async (req, res) => {
  try {
    const upload = await readMultipartUpload(req);
    const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowedMimeTypes.has(upload.mimeType)) {
      return res.status(400).json({ message: "Only JPG, PNG, and WebP uploads are allowed." });
    }
    if (!upload.buffer.length) {
      return res.status(400).json({ message: "Uploaded file is empty." });
    }

    const safeName = sanitizeFilename(upload.filename);
    const ext = safeName.ext || extForMime(upload.mimeType);
    if (!ext) {
      return res.status(400).json({ message: "Unsupported file type." });
    }

    const finalName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${safeName.stem}${ext}`;
    const targetPath = path.join(uploadsDir, finalName);
    await fs.promises.writeFile(targetPath, upload.buffer);

    return res.status(201).json({ url: `/uploads/${finalName}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    const status = /size limit|multipart|No file field|Malformed upload/i.test(message) ? 400 : 500;
    return res.status(status).json({ message });
  }
});

app.get("/api/admin/nursing-homes", adminAuth, async (_req, res) => {
  const search = cleanText(_req.query.search, 120);
  const state = cleanText(_req.query.state, 20).toUpperCase();
  const limit = Math.min(Math.max(Number(_req.query.limit) || 10, 1), 50);
  const offset = Math.max(Number(_req.query.offset) || 0, 0);
  const hasSearch = !!search;
  const hasState = !!state && state !== "ALL";
  const filters = [];
  const params = [];

  if (hasSearch) {
    params.push(`%${search.toLowerCase()}%`);
    const idx = params.length;
    filters.push(`(
      LOWER(COALESCE(name, '')) LIKE $${idx}
      OR LOWER(COALESCE(suburb, '')) LIKE $${idx}
      OR LOWER(COALESCE(state, '')) LIKE $${idx}
      OR LOWER(COALESCE(postcode, '')) LIKE $${idx}
      OR LOWER(COALESCE(provider_name, '')) LIKE $${idx}
    )`);
  }

  if (hasState) {
    params.push(state);
    filters.push(`UPPER(COALESCE(state, '')) = $${params.length}`);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const countResult = await query(
    `SELECT COUNT(*)::int AS count FROM nursing_homes ${whereClause}`,
    params,
  );
  params.push(limit);
  params.push(offset);
  const result = await query(
    `SELECT * FROM nursing_homes
     ${whereClause}
     ORDER BY name ASC
     LIMIT $${params.length - 1}
     OFFSET $${params.length}`,
    params,
  );

  const stateCountsResult = await query(
    `SELECT UPPER(COALESCE(state, '')) AS state, COUNT(*)::int AS count
     FROM nursing_homes
     GROUP BY UPPER(COALESCE(state, ''))
     ORDER BY UPPER(COALESCE(state, '')) ASC`,
  );

  const items = result.rows.map(rowToAdminListItem);

  return res.json(
    {
      items,
      total: countResult.rows[0]?.count ?? 0,
      limit,
      offset,
      stateCounts: stateCountsResult.rows.map((row) => ({
        state: row.state || "",
        count: row.count ?? 0,
      })),
    },
  );
});

app.get("/api/admin/nursing-homes/gap-candidates", adminAuth, async (req, res) => {
  const state = String(req.query.state || "").trim().toUpperCase();
  const params = [];
  const whereClause = state ? "WHERE UPPER(COALESCE(state, '')) = $1" : "";
  if (state) params.push(state);

  const result = await query(
    `SELECT * FROM nursing_homes
     ${whereClause}
     ORDER BY name ASC`,
    params,
  );

  const candidates = result.rows
    .map((row) => ({
      id: Number(row.id),
      name: row.name,
      suburb: row.suburb,
      state: row.state,
      ...getFacilityGapInfo(row),
    }))
    .filter((row) => row.missingFields.length > 0);

  return res.json(candidates);
});

app.get("/api/admin/nursing-homes/:id", adminAuth, async (req, res) => {
  const result = await query("SELECT * FROM nursing_homes WHERE id = $1", [req.params.id]);
  const row = result.rows[0];
  if (!row) return res.status(404).json({ message: "Nursing home not found." });
  return res.json(rowToAdminNursingHome(row));
});

function nursingHomePayload(body) {
  return [
    String(body.name || "").trim(),
    String(body.oneLineDescription || "").trim() || null,
    String(body.description || "").trim() || null,
    String(body.addressLine1 || "").trim() || null,
    String(body.suburb || "").trim(),
    String(body.state || "").trim() || "QLD",
    String(body.postcode || "").trim(),
    body.latitude == null || body.latitude === "" ? null : Number(body.latitude),
    body.longitude == null || body.longitude === "" ? null : Number(body.longitude),
    String(body.phone || "").trim() || null,
    String(body.website || "").trim() || null,
    String(body.email || "").trim() || null,
    String(body.internalNotes || "").trim() || null,
    String(body.status || "").trim() || "ACTIVE",
    body.activeVacancies == null || body.activeVacancies === "" ? null : Number(body.activeVacancies),
    String(body.verifiedAt || "").trim() || null,
    String(body.primaryImageUrl || "").trim() || null,
    JSON.stringify(toJsonArray(body.galleryImageUrls)),
    JSON.stringify(toJsonArray(body.featureTags)),
    JSON.stringify(toJsonArray(body.otherTags)),
    JSON.stringify(toJsonArray(body.languages)),
    JSON.stringify(toJsonArray(body.roomOptions)),
  ];
}

app.post("/api/admin/nursing-homes", adminAuth, async (req, res) => {
  try {
    const body = await persistFacilityImageFields(req.body || {});
    if (!String(body.name || "").trim() || !String(body.suburb || "").trim() || !String(body.postcode || "").trim()) {
      return res.status(400).json({ message: "Name, suburb, state, and postcode are required." });
    }

    const result = await query(
      `INSERT INTO nursing_homes (
        name, one_line_description, description, address_line1, suburb, state, postcode,
        latitude, longitude, phone, website, email, internal_notes, status, active_vacancies,
        verified_at, primary_image_url, gallery_image_urls, feature_tags, other_tags, languages, room_options
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,
        $8,$9,$10,$11,$12,$13,$14,$15,
        $16,$17,$18::jsonb,$19::jsonb,$20::jsonb,$21::jsonb,$22::jsonb
      ) RETURNING *`,
      nursingHomePayload(body),
    );
    return res.status(201).json({ id: Number(result.rows[0].id), name: result.rows[0].name });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save nursing home.";
    return res.status(400).json({ message });
  }
});

app.put("/api/admin/nursing-homes/:id", adminAuth, async (req, res) => {
  try {
    const body = await persistFacilityImageFields(req.body || {});
    const result = await query(
      `UPDATE nursing_homes
       SET name = $2,
           one_line_description = $3,
           description = $4,
           address_line1 = $5,
           suburb = $6,
           state = $7,
           postcode = $8,
           latitude = $9,
           longitude = $10,
           phone = $11,
           website = $12,
           email = $13,
           internal_notes = $14,
           status = $15,
           active_vacancies = $16,
           verified_at = $17,
           primary_image_url = $18,
           gallery_image_urls = $19::jsonb,
           feature_tags = $20::jsonb,
           other_tags = $21::jsonb,
           languages = $22::jsonb,
           room_options = $23::jsonb
       WHERE id = $1
       RETURNING *`,
      [req.params.id, ...nursingHomePayload(body)],
    );
    const row = result.rows[0];
    if (!row) return res.status(404).json({ message: "Nursing home not found." });
    return res.json({ id: Number(row.id), name: row.name });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update nursing home.";
    return res.status(400).json({ message });
  }
});

app.patch("/api/admin/nursing-homes/:id/vacancy", adminAuth, async (req, res) => {
  const { facilityConfirmedVacancies, facilityConfirmedAt } = req.body || {};
  const validValues = ["yes", "no", "unknown"];
  const confirmed = validValues.includes(facilityConfirmedVacancies) ? facilityConfirmedVacancies : null;
  if (!confirmed) return res.status(400).json({ message: "facilityConfirmedVacancies must be yes, no, or unknown." });

  const result = await query(
    `UPDATE nursing_homes
     SET facility_confirmed_vacancies = $2,
         facility_confirmed_at = $3
     WHERE id = $1
     RETURNING id, name, facility_confirmed_vacancies, facility_confirmed_at`,
    [req.params.id, confirmed, facilityConfirmedAt ?? new Date().toISOString()],
  );
  const row = result.rows[0];
  if (!row) return res.status(404).json({ message: "Facility not found." });
  return res.json({ id: Number(row.id), facilityConfirmedVacancies: row.facility_confirmed_vacancies });
});

app.delete("/api/admin/nursing-homes/:id", adminAuth, async (req, res) => {
  await query("DELETE FROM nursing_homes WHERE id = $1", [req.params.id]);
  return res.status(204).send();
});

app.post("/api/admin/nursing-homes/import", adminAuth, async (req, res) => {
  try {
    const rows = Array.isArray(req.body) ? req.body : [];
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of rows) {
      const normalizedRow = await persistFacilityImageFields(row || {});
      const name = String(normalizedRow.name || "").trim();
      const suburb = String(normalizedRow.suburb || "").trim();
      const state = String(normalizedRow.state || "").trim() || "QLD";
      const postcode = String(normalizedRow.postcode || "").trim();
      if (!name || !suburb || !postcode) {
        skipped++;
        continue;
      }

      const existing = await query(
        `SELECT id FROM nursing_homes
         WHERE LOWER(name) = LOWER($1) AND LOWER(suburb) = LOWER($2) AND postcode = $3
         LIMIT 1`,
        [name, suburb, postcode],
      );

      if (existing.rows[0]) {
        await query(
          `UPDATE nursing_homes
           SET one_line_description = COALESCE($2, one_line_description),
               description = COALESCE($3, description),
               address_line1 = COALESCE($4, address_line1),
               state = COALESCE($5, state),
               latitude = COALESCE($6, latitude),
               longitude = COALESCE($7, longitude),
               phone = COALESCE($8, phone),
               website = COALESCE($9, website),
               email = COALESCE($10, email),
               primary_image_url = COALESCE($11, primary_image_url),
               other_tags = CASE WHEN $12::jsonb = '[]'::jsonb THEN other_tags ELSE $12::jsonb END
           WHERE id = $1`,
          [
            existing.rows[0].id,
            normalizedRow.oneLineDescription || null,
            normalizedRow.description || null,
            normalizedRow.addressLine1 || null,
            state,
            normalizedRow.latitude ?? null,
            normalizedRow.longitude ?? null,
            normalizedRow.phone || null,
            normalizedRow.website || null,
            normalizedRow.email || null,
            normalizedRow.primaryImageUrl || null,
            JSON.stringify(toJsonArray(normalizedRow.otherTags)),
          ],
        );
        updated++;
      } else {
        await query(
          `INSERT INTO nursing_homes (
            name, one_line_description, description, address_line1, suburb, state, postcode,
            latitude, longitude, phone, website, email, status, primary_image_url, other_tags
          ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,
            $8,$9,$10,$11,$12,$13,$14,$15::jsonb
          )`,
          [
            name,
            normalizedRow.oneLineDescription || null,
            normalizedRow.description || null,
            normalizedRow.addressLine1 || null,
            suburb,
            state,
            postcode,
            normalizedRow.latitude ?? null,
            normalizedRow.longitude ?? null,
            normalizedRow.phone || null,
            normalizedRow.website || null,
            normalizedRow.email || null,
            normalizedRow.status || "ACTIVE",
            normalizedRow.primaryImageUrl || null,
            JSON.stringify(toJsonArray(normalizedRow.otherTags)),
          ],
        );
        created++;
      }
    }

    return res.json({ created, updated, skipped });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to import nursing homes.";
    return res.status(400).json({ message });
  }
});

function normalizeImportText(value) {
  return String(value || "").trim().toLowerCase();
}

async function findNursingHomeForImport(row) {
  if (row.facilityId != null && Number.isFinite(Number(row.facilityId))) {
    const byId = await query(`SELECT * FROM nursing_homes WHERE id = $1 LIMIT 1`, [Number(row.facilityId)]);
    if (byId.rows[0]) return byId.rows[0];
  }

  const facilityRowId = String(row.facilityRowId || "").trim();
  if (facilityRowId) {
    const byRowId = await query(`SELECT * FROM nursing_homes WHERE facility_row_id = $1 LIMIT 1`, [facilityRowId]);
    if (byRowId.rows[0]) return byRowId.rows[0];
  }

  const website = String(row.website || "").trim();
  if (website) {
    const byWebsite = await query(`SELECT * FROM nursing_homes WHERE website = $1 LIMIT 1`, [website]);
    if (byWebsite.rows[0]) return byWebsite.rows[0];
  }

  const governmentListingUrl = String(row.governmentListingUrl || "").trim();
  if (governmentListingUrl) {
    const byGovUrl = await query(`SELECT * FROM nursing_homes WHERE government_listing_url = $1 LIMIT 1`, [governmentListingUrl]);
    if (byGovUrl.rows[0]) return byGovUrl.rows[0];
  }

  const facilityName = normalizeImportText(row.facilityName || row.name);
  const suburb = normalizeImportText(row.suburb);
  const postcode = String(row.postcode || "").trim();
  if (facilityName && suburb && postcode) {
    const byName = await query(
      `SELECT * FROM nursing_homes
       WHERE LOWER(name) = LOWER($1) AND LOWER(suburb) = LOWER($2) AND postcode = $3
       LIMIT 1`,
      [facilityName, suburb, postcode],
    );
    if (byName.rows[0]) return byName.rows[0];
  }

  return null;
}

function normalizeVacancyValue(value) {
  const txt = normalizeImportText(value);
  if (!txt) return "unknown";
  if (["yes", "y", "true", "1", "vacancy", "vacancies", "available"].includes(txt)) return "yes";
  if (["no", "n", "false", "0", "full", "none", "no_vacancy"].includes(txt)) return "no";
  return "unknown";
}

function maybePublicAssetUrl(value, fallbackFileName = "") {
  const raw = String(value || fallbackFileName || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw) || raw.startsWith("/")) return raw;

  const normalized = raw.replace(/\\/g, "/");
  const publicIdx = normalized.toLowerCase().indexOf("/public/");
  if (publicIdx >= 0) {
    return normalized.slice(publicIdx + "/public".length);
  }

  const uploadsIdx = normalized.toLowerCase().indexOf("/uploads/");
  if (uploadsIdx >= 0) {
    return normalized.slice(uploadsIdx);
  }

  return `/${normalized.replace(/^\/+/, "")}`;
}

app.post("/api/admin/nursing-homes/import-vacancy-checks", adminAuth, async (req, res) => {
  const rows = Array.isArray(req.body) ? req.body : [];
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const existing = await findNursingHomeForImport(row);
    if (!existing) {
      skipped++;
      continue;
    }

    const websiteSaysVacancies = normalizeVacancyValue(row.websiteSaysVacancies ?? row.vacancyStatus);
    const facilityConfirmedVacancies = normalizeVacancyValue(row.facilityConfirmedVacancies);
    const checkedAt = String(row.websiteCheckedAt || row.checkedAt || "").trim() || new Date().toISOString();
    const websiteSourceUrl = String(row.websiteSourceUrl || row.sourceUrl || "").trim() || null;
    const facilityConfirmedAt = String(row.facilityConfirmedAt || "").trim() || null;
    const facilityConfirmationSource = String(row.facilityConfirmationSource || row.sourceType || "").trim() || null;
    const conflictFlag =
      websiteSaysVacancies !== "unknown" &&
      facilityConfirmedVacancies !== "unknown" &&
      websiteSaysVacancies !== facilityConfirmedVacancies;

    await query(
      `UPDATE nursing_homes
       SET website_says_vacancies = $2,
           facility_confirmed_vacancies = $3,
           website_checked_at = $4,
           website_source_url = COALESCE($5, website_source_url),
           facility_confirmed_at = COALESCE($6, facility_confirmed_at),
           facility_confirmation_source = COALESCE($7, facility_confirmation_source),
           conflict_flag = $8
       WHERE id = $1`,
      [
        existing.id,
        websiteSaysVacancies,
        facilityConfirmedVacancies,
        checkedAt,
        websiteSourceUrl,
        facilityConfirmedAt,
        facilityConfirmationSource,
        conflictFlag,
      ],
    );
    updated++;
  }

  return res.json({ created, updated, skipped });
});

app.post("/api/admin/nursing-homes/import-photo-manifest", adminAuth, async (req, res) => {
  const rows = Array.isArray(req.body) ? req.body : [];
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const existing = await findNursingHomeForImport(row);
    if (!existing) {
      skipped++;
      continue;
    }

    const photoUrl =
      maybePublicAssetUrl(row.localPath, row.fileName) ||
      String(row.sourceUrl || "").trim();

    if (!photoUrl) {
      skipped++;
      continue;
    }

    const gallery = toJsonArray(existing.gallery_image_urls);
    const nextGallery = gallery.includes(photoUrl) ? gallery : [...gallery, photoUrl];
    const isPrimary = !!row.isPrimary;

    await query(
      `UPDATE nursing_homes
       SET primary_image_url = CASE
             WHEN $2 THEN $3
             WHEN primary_image_url IS NULL OR primary_image_url = '' THEN $3
             ELSE primary_image_url
           END,
           gallery_image_urls = $4::jsonb
       WHERE id = $1`,
      [existing.id, isPrimary, photoUrl, JSON.stringify(nextGallery)],
    );
    updated++;
  }

  return res.json({ created, updated, skipped });
});

app.post("/api/admin/facility-outreach/send-weekly", adminAuth, async (req, res) => {
  const requestedIds = Array.isArray(req.body?.facilityIds)
    ? req.body.facilityIds.map((value) => Number(value)).filter((value) => Number.isFinite(value))
    : [];

  const facilitiesResult = requestedIds.length
    ? await query(
        `SELECT * FROM nursing_homes
         WHERE id = ANY($1::bigint[])
         ORDER BY name ASC`,
        [requestedIds],
      )
    : await query(
        `SELECT * FROM nursing_homes
         WHERE status = 'ACTIVE'
         ORDER BY name ASC`,
      );

  let sent = 0;
  let skipped = 0;
  const sentAt = new Date().toISOString();

  for (const facility of facilitiesResult.rows) {
    if (!isValidEmail(facility.email)) {
      skipped++;
      continue;
    }

    await logFacilityLoginLink(facility);
    await query(
      `UPDATE nursing_homes
       SET last_outreach_sent_at = $2
       WHERE id = $1`,
      [facility.id, sentAt],
    );
    sent++;
  }

  return res.json({ sent, skipped });
});

app.post("/api/admin/scan-facility", adminAuth, async (req, res) => {
  if (!env.firecrawlApiKey) {
    return res.status(503).json({ message: "Firecrawl API key not configured." });
  }
  let url = String(req.body?.url || "").trim();
  const govUrl = String(req.body?.govUrl || "").trim();
  if (!url && !govUrl) return res.status(400).json({ message: "url or govUrl is required." });
  if (!url && govUrl) url = govUrl;

  const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.firecrawlApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["extract"],
      extract: {
        prompt: `Extract all available information about this aged care / nursing home facility. Be thorough and capture everything published on the page.`,
        schema: {
          type: "object",
          properties: {
            name:                { type: "string", description: "Full facility name" },
            providerName:        { type: "string", description: "Organisation or provider name that operates the facility" },
            oneLineDescription:  { type: "string", description: "One sentence summary of the facility" },
            description:         { type: "string", description: "Full about/overview description of the facility" },
            addressLine1:        { type: "string", description: "Street address" },
            suburb:              { type: "string", description: "Suburb" },
            state:               { type: "string", description: "State abbreviation e.g. QLD, NSW, VIC" },
            postcode:            { type: "string", description: "Postcode" },
            phone:               { type: "string", description: "Main phone number" },
            email:               { type: "string", description: "Contact email address" },
            primaryImageUrl:     { type: "string", description: "Best main facility image URL if available" },
            galleryImageUrls:    { type: "array", items: { type: "string" }, description: "Additional facility image URLs if available" },
            careTypes:           { type: "array", items: { type: "string" }, description: "Care types offered e.g. Permanent Residential, Respite, Dementia, Palliative" },
            specialties:         { type: "array", items: { type: "string" }, description: "Clinical specialties or focus areas" },
            alliedHealth:        { type: "array", items: { type: "string" }, description: "Allied health services available e.g. Physiotherapy, Occupational Therapy, Podiatry, Dietitian" },
            languages:           { type: "array", items: { type: "string" }, description: "Languages spoken by staff" },
            amenities:           { type: "array", items: { type: "string" }, description: "Facility amenities e.g. Garden, Café, Chapel, Library, Gym, Hair Salon" },
            roomTypes:           { type: "array", items: { type: "string" }, description: "Types of rooms available e.g. Single, Shared, Studio, Deluxe" },
            radFrom:             { type: "number", description: "Minimum RAD (Refundable Accommodation Deposit) in AUD if published" },
            radTo:               { type: "number", description: "Maximum RAD in AUD if published" },
            visitingHours:       { type: "string", description: "Visiting hours policy" },
            admissionsProcess:   { type: "string", description: "How to apply or admission process description" },
            starRating:          { type: "number", description: "Star rating out of 5 if mentioned" },
            bedsCount:           { type: "number", description: "Total number of beds or residents if mentioned" },
            featureHighlights:   { type: "array", items: { type: "string" }, description: "Key selling points or feature highlights of the facility" },
            waitingListInfo:     { type: "string", description: "Any information about waiting lists" },
            transportNotes:      { type: "string", description: "Transport or location access notes" },
            nearbyHospitals:     { type: "array", items: { type: "string" }, description: "Nearby hospitals mentioned" },
          },
        },
      },
    }),
  });

  if (!scrapeRes.ok) {
    const err = await scrapeRes.text().catch(() => "Unknown error");
    return res.status(502).json({ message: `Firecrawl error: ${err}` });
  }

  const data = await scrapeRes.json();
  const websiteExtract = data?.extract ?? data?.data?.extract ?? {};

  if (!govUrl) {
    return res.json(websiteExtract);
  }

  const govScrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.firecrawlApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: govUrl,
      formats: ["extract"],
      extract: {
        prompt: `Extract the official facility address and any facility photo URLs from this My Aged Care or government listing page. Prefer the street address exactly as shown on the page. Return the best main photo URL and any additional gallery photo URLs if they exist.`,
        schema: {
          type: "object",
          properties: {
            addressLine1:     { type: "string", description: "Street address exactly as listed" },
            suburb:           { type: "string", description: "Suburb/locality" },
            state:            { type: "string", description: "State abbreviation" },
            postcode:         { type: "string", description: "Postcode" },
            primaryImageUrl:  { type: "string", description: "Best main facility photo URL if present on the listing" },
            galleryImageUrls: { type: "array", items: { type: "string" }, description: "Additional facility photo URLs from the listing" },
          },
        },
      },
    }),
  });

  if (!govScrapeRes.ok) {
    return res.json(websiteExtract);
  }

  const govData = await govScrapeRes.json();
  const governmentExtract = govData?.extract ?? govData?.data?.extract ?? {};
  const mergedGallery = uniqueTrimmed([
    ...toJsonArray(governmentExtract.galleryImageUrls),
    ...toJsonArray(websiteExtract.galleryImageUrls),
    String(governmentExtract.primaryImageUrl || "").trim(),
    String(websiteExtract.primaryImageUrl || "").trim(),
  ]);

  return res.json({
    ...websiteExtract,
    addressLine1: String(governmentExtract.addressLine1 || websiteExtract.addressLine1 || "").trim() || undefined,
    suburb: String(governmentExtract.suburb || websiteExtract.suburb || "").trim() || undefined,
    state: String(governmentExtract.state || websiteExtract.state || "").trim() || undefined,
    postcode: String(governmentExtract.postcode || websiteExtract.postcode || "").trim() || undefined,
    primaryImageUrl:
      String(governmentExtract.primaryImageUrl || websiteExtract.primaryImageUrl || mergedGallery[0] || "").trim() || undefined,
    galleryImageUrls: mergedGallery,
    governmentListingUrl: govUrl,
  });
});

app.post("/api/admin/nursing-homes/gap-fill/:id", adminAuth, async (req, res) => {
  if (!env.firecrawlApiKey) {
    return res.status(503).json({ message: "Firecrawl API key not configured." });
  }

  const facilityId = Number(req.params.id);
  if (!facilityId) return res.status(400).json({ message: "Facility id is required." });

  const facilityResult = await query("SELECT * FROM nursing_homes WHERE id = $1", [facilityId]);
  const row = facilityResult.rows[0];
  if (!row) return res.status(404).json({ message: "Facility not found." });

  const gapInfo = getFacilityGapInfo(row);
  const website = String(row.website || "").trim();
  const govUrl = String(row.government_listing_url || "").trim();

  let oneLineDescription = row.one_line_description;
  let description = row.description;
  let addressLine1 = row.address_line1;
  let phone = row.phone;
  let email = row.email;
  let featureTags = toJsonArray(row.feature_tags);
  let otherTags = toJsonArray(row.other_tags);
  let languages = toJsonArray(row.languages);
  let roomOptions = toJsonArray(row.room_options);
  let websiteSaysVacancies = row.website_says_vacancies;
  let websiteCheckedAt = row.website_checked_at;
  let websiteSourceUrl = row.website_source_url;
  let changed = false;

  const needsWebProfile = gapInfo.missingDetails.some((item) => item.source === "Web" && item.label !== "Vacancy status");
  if (website && needsWebProfile) {
    const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: website,
        formats: ["extract"],
        extract: {
          prompt: `Extract all available information about this aged care / nursing home facility. Be thorough and capture everything published on the page.`,
          schema: {
            type: "object",
            properties: {
              oneLineDescription:  { type: "string" },
              description:         { type: "string" },
              addressLine1:        { type: "string" },
              phone:               { type: "string" },
              email:               { type: "string" },
              careTypes:           { type: "array", items: { type: "string" } },
              specialties:         { type: "array", items: { type: "string" } },
              alliedHealth:        { type: "array", items: { type: "string" } },
              languages:           { type: "array", items: { type: "string" } },
              amenities:           { type: "array", items: { type: "string" } },
              roomTypes:           { type: "array", items: { type: "string" } },
              featureHighlights:   { type: "array", items: { type: "string" } },
            },
          },
        },
      }),
    });

    if (!scrapeRes.ok) {
      const err = await scrapeRes.text().catch(() => "Unknown error");
      return res.status(502).json({ message: `Firecrawl error: ${err}` });
    }

    const profileData = await scrapeRes.json();
    const extract = profileData?.extract ?? profileData?.data?.extract ?? {};
    if (!String(oneLineDescription || "").trim() && String(extract.oneLineDescription || "").trim()) {
      oneLineDescription = String(extract.oneLineDescription).trim();
      changed = true;
    }
    if (!String(description || "").trim() && String(extract.description || "").trim()) {
      description = String(extract.description).trim();
      changed = true;
    }
    if (!String(addressLine1 || "").trim() && String(extract.addressLine1 || "").trim()) {
      addressLine1 = String(extract.addressLine1).trim();
      changed = true;
    }
    if (!String(phone || "").trim() && String(extract.phone || "").trim()) {
      phone = String(extract.phone).trim();
      changed = true;
    }
    if (!String(email || "").trim() && String(extract.email || "").trim()) {
      email = String(extract.email).trim();
      changed = true;
    }

    const nextFeatureTags = uniqueTrimmed([
      ...featureTags,
      ...toJsonArray(extract.careTypes),
      ...toJsonArray(extract.specialties),
      ...toJsonArray(extract.featureHighlights),
      ...toJsonArray(extract.alliedHealth),
    ]);
    const nextOtherTags = uniqueTrimmed([
      ...otherTags,
      ...toJsonArray(extract.amenities),
      ...toJsonArray(extract.roomTypes),
    ]);
    const nextLanguages = uniqueTrimmed([...languages, ...toJsonArray(extract.languages)]);

    if (nextFeatureTags.length !== featureTags.length) {
      featureTags = nextFeatureTags;
      changed = true;
    }
    if (nextOtherTags.length !== otherTags.length) {
      otherTags = nextOtherTags;
      changed = true;
    }
    if (nextLanguages.length !== languages.length) {
      languages = nextLanguages;
      changed = true;
    }
  }

  if (website && normalizeVacancyValue(websiteSaysVacancies) === "unknown") {
    const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: website,
        formats: ["extract"],
        extract: {
          prompt: `Check this aged care / nursing home website for current bed vacancies or room availability. Look for any mention of available rooms, vacancies, waiting lists, "enquire now", admissions, or similar. Return a concise summary.`,
          schema: {
            type: "object",
            properties: {
              hasVacancy: { type: "string", enum: ["yes", "no", "unknown"] },
            },
          },
        },
      }),
    });

    if (scrapeRes.ok) {
      const vacancyData = await scrapeRes.json();
      const extract = vacancyData?.extract ?? vacancyData?.data?.extract ?? {};
      const nextVacancy = normalizeVacancyValue(extract.hasVacancy);
      if (nextVacancy !== "unknown") {
        websiteSaysVacancies = nextVacancy;
        websiteCheckedAt = new Date().toISOString();
        websiteSourceUrl = website;
        changed = true;
      }
    }
  }

  if (govUrl && !hasMeaningfulRoomOptions(roomOptions)) {
    const roomsUrl = govUrl.split("?")[0].replace(/\/$/, "") + "/rooms-and-cost";
    const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: roomsUrl,
        formats: ["extract"],
        extract: {
          prompt: `Extract every individual room option listed on this MyAgedCare rooms-and-cost page. For each room return: the full room name, bathroom type, room size in square metres, the RAD lump sum amount in AUD, the DAP daily rate in AUD, and the current availability status. If only one RAD amount is shown use it for both radMin and radMax.`,
          schema: {
            type: "object",
            properties: {
              rooms: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    roomType: { type: "string" },
                    roomName: { type: "string" },
                    bathroomType: { type: "string" },
                    sizeM2: { type: "number" },
                    radMin: { type: "number" },
                    radMax: { type: "number" },
                    dapAmount: { type: "number" },
                    availabilityNote: { type: "string" },
                  },
                },
              },
            },
          },
        },
      }),
    });

    if (scrapeRes.ok) {
      const roomsData = await scrapeRes.json();
      const extract = roomsData?.extract ?? roomsData?.data?.extract ?? {};
      const rooms = Array.isArray(extract.rooms) ? extract.rooms : [];
      if (rooms.length > 0) {
        roomOptions = rooms;
        changed = true;
      }
    }
  }

  if (changed) {
    await query(
      `UPDATE nursing_homes
       SET one_line_description = COALESCE($2, one_line_description),
           description = COALESCE($3, description),
           address_line1 = COALESCE($4, address_line1),
           phone = COALESCE($5, phone),
           email = COALESCE($6, email),
           feature_tags = $7::jsonb,
           other_tags = $8::jsonb,
           languages = $9::jsonb,
           room_options = $10::jsonb,
           website_says_vacancies = COALESCE($11, website_says_vacancies),
           website_checked_at = COALESCE($12, website_checked_at),
           website_source_url = COALESCE($13, website_source_url),
           last_profile_scan_at = $14
       WHERE id = $1`,
      [
        facilityId,
        String(oneLineDescription || "").trim() || null,
        String(description || "").trim() || null,
        String(addressLine1 || "").trim() || null,
        String(phone || "").trim() || null,
        String(email || "").trim() || null,
        JSON.stringify(featureTags),
        JSON.stringify(otherTags),
        JSON.stringify(languages),
        JSON.stringify(roomOptions),
        normalizeVacancyValue(websiteSaysVacancies),
        websiteCheckedAt || null,
        String(websiteSourceUrl || "").trim() || null,
        new Date().toISOString(),
      ],
    );
  }

  const updatedResult = await query("SELECT * FROM nursing_homes WHERE id = $1", [facilityId]);
  return res.json(rowToAdminNursingHome(updatedResult.rows[0]));
});

app.post("/api/admin/scan-vacancy", adminAuth, async (req, res) => {
  if (!env.firecrawlApiKey) {
    return res.status(503).json({ message: "Firecrawl API key not configured." });
  }
  const facilityId = Number(req.body?.facilityId);
  if (!facilityId) return res.status(400).json({ message: "facilityId is required." });

  const facilityResult = await query("SELECT id, name, website FROM nursing_homes WHERE id = $1", [facilityId]);
  const facility = facilityResult.rows[0];
  if (!facility) return res.status(404).json({ message: "Facility not found." });

  const url = String(facility.website || "").trim();
  if (!url) return res.status(400).json({ message: "This facility has no website URL set." });

  const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.firecrawlApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["extract"],
      extract: {
        prompt: `Check this aged care / nursing home website for current bed vacancies or room availability. Look for any mention of available rooms, vacancies, waiting lists, "enquire now", admissions, or similar. Return a concise summary.`,
        schema: {
          type: "object",
          properties: {
            hasVacancy: {
              type: "string",
              enum: ["yes", "no", "unknown"],
              description: "yes if the page explicitly mentions current vacancies or available beds; no if it says currently full or no vacancies; unknown if unclear",
            },
            vacancySummary: {
              type: "string",
              description: "One or two sentences summarising what the website says about availability",
            },
            rawExcerpt: {
              type: "string",
              description: "The exact text from the page that indicates vacancy status (max 300 chars)",
            },
          },
        },
      },
    }),
  });

  if (!scrapeRes.ok) {
    const err = await scrapeRes.text().catch(() => "Unknown error");
    return res.status(502).json({ message: `Firecrawl error: ${err}` });
  }

  const data = await scrapeRes.json();
  const extract = data?.extract ?? data?.data?.extract ?? {};
  const hasVacancy = extract.hasVacancy ?? "unknown";
  const checkedAt = new Date().toISOString();

  await query(
    `UPDATE nursing_homes
     SET website_says_vacancies = $1,
         website_checked_at = $2,
         website_source_url = $3
     WHERE id = $4`,
    [hasVacancy, checkedAt, url, facilityId],
  );

  return res.json({
    facilityId,
    facilityName: facility.name,
    websiteSaysVacancies: hasVacancy,
    websiteCheckedAt: checkedAt,
    vacancySummary: extract.vacancySummary ?? null,
    rawExcerpt: extract.rawExcerpt ?? null,
  });
});

// POST /api/admin/scan-rooms
// Scrapes the MyAgedCare rooms-and-cost page for a facility and returns structured room data.
app.post("/api/admin/scan-rooms", adminAuth, async (req, res) => {
  if (!env.firecrawlApiKey) {
    return res.status(503).json({ message: "Firecrawl API key not configured." });
  }

  let govUrl = String(req.body?.govUrl || "").trim();

  // If a facilityId is given, look up the government_listing_url from the DB
  if (!govUrl && req.body?.facilityId) {
    const r = await query("SELECT government_listing_url FROM nursing_homes WHERE id = $1", [Number(req.body.facilityId)]);
    govUrl = r.rows[0]?.government_listing_url || "";
  }

  if (!govUrl) return res.status(400).json({ message: "No MyAgedCare URL found. Set the Government Listing URL on this facility first." });

  // Build the rooms-and-cost URL
  const roomsUrl = govUrl.split("?")[0].replace(/\/$/, "") + "/rooms-and-cost";

  const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.firecrawlApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: roomsUrl,
      formats: ["extract"],
      extract: {
        prompt: `Extract every individual room option listed on this MyAgedCare rooms-and-cost page. For each room return: the full room name, bathroom type (Ensuite or Shared), room size in square metres, the RAD (Refundable Accommodation Deposit) lump sum amount in AUD, the DAP (Daily Accommodation Payment) daily rate in AUD, and the current availability status. If only one RAD amount is shown use it for both radMin and radMax.`,
        schema: {
          type: "object",
          properties: {
            rooms: {
              type: "array",
              description: "One entry per distinct room type listed on the page",
              items: {
                type: "object",
                properties: {
                  roomType:         { type: "string",  description: "Full room name/type e.g. 'Boronia Wing – Single Room with Ensuite'" },
                  bathroomType:     { type: "string",  description: "Bathroom type: Ensuite or Shared bathroom" },
                  sizeM2:           { type: "number",  description: "Room size in square metres e.g. 10.4" },
                  radMin:           { type: "number",  description: "Minimum RAD (Refundable Accommodation Deposit) lump sum in AUD e.g. 350000. If only one amount listed use it for both." },
                  radMax:           { type: "number",  description: "Maximum RAD lump sum in AUD e.g. 550000" },
                  dapAmount:        { type: "number",  description: "Daily Accommodation Payment in AUD e.g. 157.19 — the daily fee shown as alternative to paying the full RAD" },
                  availabilityNote: { type: "string",  description: "Current availability e.g. Currently available, Waitlist only" },
                },
              },
            },
          },
        },
      },
    }),
  });

  if (!scrapeRes.ok) {
    const err = await scrapeRes.text().catch(() => "Unknown error");
    return res.status(502).json({ message: `Firecrawl error: ${err}` });
  }

  const data = await scrapeRes.json();
  const extract = data?.extract ?? data?.data?.extract ?? {};
  const rooms = Array.isArray(extract.rooms) ? extract.rooms : [];

  return res.json({ rooms, scannedUrl: roomsUrl });
});

app.post("/api/admin/nursing-homes/import-location-centers", adminAuth, async (req, res) => {
  const rows = Array.isArray(req.body) ? req.body : [];
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const suburb = String(row.suburb || "").trim();
    const state = String(row.state || "").trim() || "QLD";
    const postcode = String(row.postcode || "").trim();
    const latitude = Number(row.latitude);
    const longitude = Number(row.longitude);
    if (!suburb || !postcode || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      skipped++;
      continue;
    }

    const existing = await query(
      `SELECT id FROM suburb_location_centers
       WHERE LOWER(suburb) = LOWER($1) AND LOWER(state) = LOWER($2) AND postcode = $3
       LIMIT 1`,
      [suburb, state, postcode],
    );

    if (existing.rows[0]) {
      await query(
        `UPDATE suburb_location_centers
         SET latitude = $2, longitude = $3
         WHERE id = $1`,
        [existing.rows[0].id, latitude, longitude],
      );
      updated++;
    } else {
      await query(
        `INSERT INTO suburb_location_centers (suburb, state, postcode, latitude, longitude)
         VALUES ($1, $2, $3, $4, $5)`,
        [suburb, state, postcode, latitude, longitude],
      );
      created++;
    }
  }

  return res.json({ created, updated, skipped });
});

// ── Blog SSR — serve real HTML to crawlers so posts get indexed ───────────────

function escHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function blogPostHtml(post) {
  const siteUrl = "https://www.nursinghomesnearme.com.au";
  const canonical = `${siteUrl}/blog/${post.slug}`;
  const paragraphs = post.content.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  const excerpt = paragraphs[0]?.slice(0, 155) ?? post.metaDescription;
  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: excerpt,
    image: `${siteUrl}${post.image}`,
    url: canonical,
    mainEntityOfPage: canonical,
    datePublished: post.datePublished,
    dateModified: post.datePublished,
    author: { "@type": "Organization", name: "Nursing Homes Near Me" },
    publisher: {
      "@type": "Organization",
      name: "Nursing Homes Near Me",
      logo: { "@type": "ImageObject", url: `${siteUrl}/favicon-512.png` },
    },
  });
  const paragraphsHtml = paragraphs.map(p => `<p>${escHtml(p)}</p>`).join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escHtml(post.title)} | Nursing Homes Near Me</title>
<meta name="description" content="${escHtml(post.metaDescription)}"/>
<link rel="canonical" href="${escHtml(canonical)}"/>
<meta property="og:type" content="article"/>
<meta property="og:title" content="${escHtml(post.title)}"/>
<meta property="og:description" content="${escHtml(post.metaDescription)}"/>
<meta property="og:url" content="${escHtml(canonical)}"/>
<meta property="og:image" content="${escHtml(siteUrl + post.image)}"/>
<meta property="og:site_name" content="Nursing Homes Near Me"/>
<script type="application/ld+json">${schema}</script>
<style>
  body{font-family:system-ui,sans-serif;max-width:860px;margin:0 auto;padding:24px 16px;color:#1e293b;background:#fff}
  h1{font-size:2rem;line-height:1.25;margin-bottom:8px}
  p{line-height:1.75;margin-bottom:1.2em;font-size:1.05rem}
  a{color:#0f766e}
  nav{margin-bottom:24px;font-size:14px}
  time{color:#64748b;font-size:14px;display:block;margin-bottom:24px}
</style>
</head>
<body>
<nav><a href="/">Home</a> &rsaquo; <a href="/blog">Blog</a> &rsaquo; ${escHtml(post.title)}</nav>
<article>
<h1>${escHtml(post.title)}</h1>
<time datetime="${escHtml(post.datePublished)}">${new Date(post.datePublished).toLocaleDateString("en-AU",{year:"numeric",month:"long",day:"numeric"})}</time>
${paragraphsHtml}
</article>
<p style="margin-top:40px"><a href="/blog">&larr; Back to all guides</a></p>
<p style="margin-top:16px"><a href="/referral">Get free placement help &rarr;</a></p>
</body>
</html>`;
}

function blogIndexHtml() {
  const siteUrl = "https://www.nursinghomesnearme.com.au";
  const sorted = [...blogPosts].sort((a, b) => b.datePublished.localeCompare(a.datePublished));
  const listItems = sorted.map(p =>
    `<li style="margin-bottom:24px">
      <a href="/blog/${escHtml(p.slug)}" style="font-size:1.15rem;font-weight:700;color:#0f766e;text-decoration:none">${escHtml(p.title)}</a>
      <p style="margin:4px 0 0;color:#475569;font-size:0.95rem">${escHtml(p.metaDescription)}</p>
      <time style="font-size:13px;color:#94a3b8">${new Date(p.datePublished).toLocaleDateString("en-AU",{year:"numeric",month:"long",day:"numeric"})}</time>
    </li>`
  ).join("\n");
  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Nursing Homes Near Me — Aged Care Guides",
    url: `${siteUrl}/blog`,
    description: "Practical guides for Australian families navigating aged care placement, costs, rights, and quality.",
  });
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Aged Care Guides for Australian Families | Nursing Homes Near Me</title>
<meta name="description" content="Practical, plain-English guides to help Australian families navigate nursing home placement, aged care costs, rights, and quality."/>
<link rel="canonical" href="${siteUrl}/blog"/>
<meta property="og:type" content="website"/>
<meta property="og:title" content="Aged Care Guides for Australian Families | Nursing Homes Near Me"/>
<meta property="og:description" content="Practical, plain-English guides to help Australian families navigate nursing home placement, aged care costs, rights, and quality."/>
<meta property="og:url" content="${siteUrl}/blog"/>
<script type="application/ld+json">${schema}</script>
<style>
  body{font-family:system-ui,sans-serif;max-width:860px;margin:0 auto;padding:24px 16px;color:#1e293b;background:#fff}
  h1{font-size:2rem;line-height:1.25;margin-bottom:8px}
  ul{list-style:none;padding:0;margin:32px 0}
  a{color:#0f766e}
  nav{margin-bottom:24px;font-size:14px}
</style>
</head>
<body>
<nav><a href="/">Home</a> &rsaquo; Blog</nav>
<h1>Aged Care Guides for Australian Families</h1>
<p style="color:#475569">Practical, plain-English information to help you navigate nursing home placement, costs, rights, and quality in Australia.</p>
<ul>${listItems}</ul>
<p><a href="/referral">Need help finding a nursing home? Get free placement guidance &rarr;</a></p>
</body>
</html>`;
}

app.get("/blog", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(blogIndexHtml());
});

app.get("/blog/:slug", (req, res, next) => {
  const post = blogPosts.find(p => p.slug === req.params.slug);
  if (!post) return next();
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(blogPostHtml(post));
});

// CareCircle API routes
// ── Public stats ─────────────────────────────────────────────────────────────

// POST /api/chat-enquiry — stores a chat message from the chat widget
app.post("/api/chat-enquiry", enquiryRateLimit, async (req, res) => {
  const name = cleanText(req.body?.name, 120);
  const email = cleanText(req.body?.email, 200);
  const message = cleanText(req.body?.message, 4000);
  if (!message) {
    return res.status(400).json({ message: "Message is required." });
  }
  if (email && !isValidEmail(email)) {
    return res.status(400).json({ message: "Email address is invalid." });
  }
  try {
    await query(
      `INSERT INTO chat_enquiries (name, email, message) VALUES ($1, $2, $3)`,
      [name ?? "", email ?? "", message ?? ""]
    );
  } catch { /* non-fatal if table doesn't exist yet */ }
  return res.status(204).end();
});

// POST /api/track/acat-view  — fire-and-forget, called when ACAT iframe loads
app.post("/api/track/acat-view", async (_req, res) => {
  try {
    await query(`INSERT INTO page_views (page) VALUES ('acat')`);
  } catch { /* non-fatal */ }
  return res.status(204).end();
});

// GET /api/stats — live platform counts for the homepage strip
app.get("/api/stats", async (_req, res) => {
  try {
    const [familiesRes, acatRes, circlesRes] = await Promise.all([
      query(`SELECT COUNT(*)::int AS count FROM client_cases WHERE date_trunc('month', created_at) = date_trunc('month', NOW())`),
      query(`SELECT COUNT(*)::int AS count FROM page_views WHERE page = 'acat' AND date_trunc('month', created_at) = date_trunc('month', NOW())`),
      query(`SELECT COUNT(*)::int AS count FROM cc_circles`),
    ]);
    const month = new Intl.DateTimeFormat("en-AU", { month: "long" }).format(new Date());
    return res.json({
      month,
      familiesHelpedThisMonth: familiesRes.rows[0]?.count ?? 0,
      acatViewsThisMonth: acatRes.rows[0]?.count ?? 0,
      careCircleFamilies: circlesRes.rows[0]?.count ?? 0,
    });
  } catch (err) {
    console.error("[stats]", err);
    return res.status(500).json({ month: "", familiesHelpedThisMonth: 0, acatViewsThisMonth: 0, careCircleFamilies: 0 });
  }
});

registerCareCircleRoutes(app);

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
}

async function start() {
  await runMigrations();
  app.listen(env.port, () => {
    console.log(`[server] listening on http://localhost:${env.port}`);
  });
}

start().catch((error) => {
  console.error("[server] failed to start", error);
  process.exit(1);
});
