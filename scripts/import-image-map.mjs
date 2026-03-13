#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import XLSXModule from "xlsx";
const XLSX = XLSXModule?.readFile ? XLSXModule : XLSXModule.default;

const API_BASE = process.env.API_BASE || "";
const ADMIN_TOKEN = (process.env.ADMIN_TOKEN || "").trim();
const CSV_PATH = process.argv[2];

if (!CSV_PATH) {
  console.error("Usage: node scripts/import-image-map.mjs <csv-path>");
  process.exit(1);
}
if (!ADMIN_TOKEN) {
  console.error("Missing ADMIN_TOKEN env var.");
  process.exit(1);
}

function norm(s) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function headers() {
  return {
    "X-Admin-Token": ADMIN_TOKEN,
    "Content-Type": "application/json",
  };
}

async function api(pathname, init = {}) {
  const res = await fetch(`${API_BASE}${pathname}`, init);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} ${txt}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return null;
}

async function uploadImage(localPath) {
  const file = await fs.promises.readFile(localPath);
  const filename = path.basename(localPath);
  const blob = new Blob([file]);
  const fd = new FormData();
  fd.append("file", blob, filename);

  const res = await fetch(`${API_BASE}/api/admin/uploads`, {
    method: "POST",
    headers: { "X-Admin-Token": ADMIN_TOKEN },
    body: fd,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Upload failed ${res.status}: ${txt}`);
  }
  const json = await res.json();
  if (!json?.url) throw new Error("Upload response missing url");
  return json.url;
}

async function main() {
  console.log(`API_BASE=${API_BASE}`);
  const auth = await api("/api/admin/auth/me", {
    method: "GET",
    headers: { "X-Admin-Token": ADMIN_TOKEN },
  });
  if (!auth?.authed) {
    throw new Error("ADMIN_TOKEN is invalid for this backend.");
  }

  const wb = XLSX.readFile(CSV_PATH, { raw: false });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const candidates = rows
    .map((r) => ({
      name: String(r.name || "").trim(),
      suburb: String(r.suburb || "").trim(),
      status: String(r.status || "").trim().toLowerCase(),
      imagePath: String(r.image_path || "").trim(),
    }))
    .filter((r) => r.name && r.suburb && r.imagePath && (!r.status || r.status === "ok"));

  const list = await api("/api/admin/nursing-homes", {
    method: "GET",
    headers: { "X-Admin-Token": ADMIN_TOKEN },
  });

  const index = new Map();
  for (const item of list || []) {
    index.set(`${norm(item.name)}|${norm(item.suburb)}`, item.id);
  }

  let uploaded = 0;
  let updated = 0;
  let notFound = 0;
  let missingFile = 0;
  let failed = 0;

  for (const row of candidates) {
    const key = `${norm(row.name)}|${norm(row.suburb)}`;
    const id = index.get(key);
    if (!id) {
      notFound++;
      continue;
    }
    if (!fs.existsSync(row.imagePath)) {
      missingFile++;
      continue;
    }
    try {
      const imageUrl = await uploadImage(row.imagePath);
      uploaded++;

      const current = await api(`/api/admin/nursing-homes/${id}`, {
        method: "GET",
        headers: { "X-Admin-Token": ADMIN_TOKEN },
      });

      const payload = {
        name: current.name || row.name,
        oneLineDescription: current.oneLineDescription || "",
        description: current.description || "",
        addressLine1: current.addressLine1 || "",
        suburb: current.suburb || row.suburb,
        state: current.state || "QLD",
        postcode: current.postcode || "",
        latitude: current.latitude ?? null,
        longitude: current.longitude ?? null,
        phone: current.phone || "",
        website: current.website || "",
        email: current.email || "",
        internalNotes: current.internalNotes || "",
        status: current.status || "ACTIVE",
        activeVacancies: current.activeVacancies ?? null,
        verifiedAt: current.verifiedAt || null,
        primaryImageUrl: imageUrl,
        galleryImageUrls: current.galleryImageUrls || [],
        featureTags: current.featureTags || [],
        otherTags: current.otherTags || [],
        languages: current.languages || [],
        roomOptions: current.roomOptions || [],
      };

      await api(`/api/admin/nursing-homes/${id}`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify(payload),
      });
      updated++;
      console.log(`Updated: ${row.name} (${row.suburb})`);
    } catch (e) {
      failed++;
      console.error(`Failed: ${row.name} (${row.suburb}) - ${e.message}`);
    }
  }

  console.log("\nDone.");
  console.log(`Candidates: ${candidates.length}`);
  console.log(`Uploaded files: ${uploaded}`);
  console.log(`Updated records: ${updated}`);
  console.log(`No match in DB: ${notFound}`);
  console.log(`Missing local file: ${missingFile}`);
  console.log(`Failed: ${failed}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
