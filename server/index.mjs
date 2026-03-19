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

const app = express();

// Redirect non-www to www in production
app.use((req, res, next) => {
  if (req.hostname === "nursinghomesnearme.com.au") {
    return res.redirect(301, `https://www.nursinghomesnearme.com.au${req.originalUrl}`);
  }
  next();
});

app.use(
  cors({
    origin: env.allowedOrigin || true,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));

function signAdminToken() {
  return jwt.sign({ role: "admin" }, env.appSecret, { expiresIn: "30d" });
}

function signClientAuthToken(clientCaseId, publicToken) {
  return jwt.sign({ role: "client", clientCaseId, publicToken }, env.appSecret, { expiresIn: "30d" });
}

function verifyToken(token) {
  return jwt.verify(token, env.appSecret);
}

function adminAuth(req, res, next) {
  const token = (req.header("X-Admin-Token") || "").trim();
  if (!token) return res.status(401).json({ message: "Missing admin token." });
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

function parseMaybeDate(value) {
  const trimmed = String(value ?? "").trim();
  return trimmed ? trimmed : null;
}

function toJsonArray(value) {
  return Array.isArray(value) ? value : [];
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

app.post("/api/admin/auth/login", async (req, res) => {
  const password = String(req.body?.password || "").trim();
  if (!password || password !== env.adminPassword) {
    return res.status(401).json({ message: "Incorrect password." });
  }
  return res.json({ token: signAdminToken() });
});

app.post("/api/workflow/placement-intake", async (req, res) => {
  const body = req.body || {};
  const clientEmail = String(body.email || "").trim().toLowerCase();
  const contactName = String(body.contactName || "").trim();
  const preferredLocations = Array.isArray(body.preferredLocations) ? body.preferredLocations.filter(Boolean) : [];
  const careTypes = Array.isArray(body.careTypes) ? body.careTypes.filter(Boolean) : [];

  if (!clientEmail || !contactName) {
    return res.status(400).json({ message: "Contact name and email are required." });
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
      String(body.phone || "").trim() || null,
      preferredLocations.join(", ") || null,
      String(body.timing || "").trim() || null,
      String(body.currentLocation || "").trim() || null,
      String(body.notes || "").trim() || null,
      body.consentToShare ? "Yes" : "No",
      JSON.stringify(careTypes),
      JSON.stringify(preferredLocations),
      String(body.fundingPlan || "").trim() || null,
      String(body.budgetRange || "").trim() || null,
      String(body.waitingListPreference || "").trim() || null,
      String(body.supportAtHome || "").trim() || null,
      String(body.acatNumber || "").trim() || null,
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

app.post("/api/workflow/request-login-link", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ message: "Email is required." });

  const result = await query(
    `SELECT * FROM client_cases
     WHERE LOWER(client_email) = LOWER($1)
     ORDER BY created_at DESC
     LIMIT 1`,
    [email],
  );
  const row = result.rows[0];
  if (!row) {
    return res.status(404).json({ message: "No client case found for that email yet." });
  }

  const delivery = await logLoginLink(row);
  return res.json(delivery);
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

app.get("/api/workflow/client/:token", async (req, res) => {
  const row = await findCaseByToken(req.params.token);
  if (!row) return res.status(404).json({ message: "Workflow not found." });
  return res.json(rowToWorkflowSnapshot(row, getClientAuth(req, row)));
});

app.post("/api/workflow/client/:token/set-password", async (req, res) => {
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

app.post("/api/workflow/client/:token/login", async (req, res) => {
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

app.get("/api/admin/nursing-homes", adminAuth, async (_req, res) => {
  const result = await query("SELECT * FROM nursing_homes ORDER BY name ASC");
  return res.json(
    result.rows.map((row) => ({
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
    })),
  );
});

app.get("/api/admin/nursing-homes/:id", adminAuth, async (req, res) => {
  const result = await query("SELECT * FROM nursing_homes WHERE id = $1", [req.params.id]);
  const row = result.rows[0];
  if (!row) return res.status(404).json({ message: "Nursing home not found." });
  return res.json({
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
    email: row.email,
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
  });
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
  const body = req.body || {};
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
});

app.put("/api/admin/nursing-homes/:id", adminAuth, async (req, res) => {
  const body = req.body || {};
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
  const rows = Array.isArray(req.body) ? req.body : [];
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = String(row.name || "").trim();
    const suburb = String(row.suburb || "").trim();
    const state = String(row.state || "").trim() || "QLD";
    const postcode = String(row.postcode || "").trim();
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
          row.oneLineDescription || null,
          row.description || null,
          row.addressLine1 || null,
          state,
          row.latitude ?? null,
          row.longitude ?? null,
          row.phone || null,
          row.website || null,
          row.email || null,
          row.primaryImageUrl || null,
          JSON.stringify(toJsonArray(row.otherTags)),
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
          row.oneLineDescription || null,
          row.description || null,
          row.addressLine1 || null,
          suburb,
          state,
          postcode,
          row.latitude ?? null,
          row.longitude ?? null,
          row.phone || null,
          row.website || null,
          row.email || null,
          row.status || "ACTIVE",
          row.primaryImageUrl || null,
          JSON.stringify(toJsonArray(row.otherTags)),
        ],
      );
      created++;
    }
  }

  return res.json({ created, updated, skipped });
});

app.post("/api/admin/scan-facility", adminAuth, async (req, res) => {
  if (!env.firecrawlApiKey) {
    return res.status(503).json({ message: "Firecrawl API key not configured." });
  }
  const url = String(req.body?.url || "").trim();
  if (!url) return res.status(400).json({ message: "url is required." });

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
  return res.json(data?.extract ?? data?.data?.extract ?? {});
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
