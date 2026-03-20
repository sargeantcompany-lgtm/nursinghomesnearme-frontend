#!/usr/bin/env node
/**
 * scan-vacancies.mjs
 *
 * Second-pass script — reads facilities_australia.csv and scans each facility's
 * website + My Aged Care rooms tab for vacancy and room cost information.
 * Updates the CSV in place.
 *
 * Usage:
 *   node scripts/scan-vacancies.mjs
 *   node scripts/scan-vacancies.mjs --limit 10
 *   node scripts/scan-vacancies.mjs --input scripts/facilities_australia.csv
 */

import puppeteer from "puppeteer";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const inputFile = (() => {
  const i = args.indexOf("--input");
  return i !== -1 ? args[i + 1] : join(__dirname, "facilities_australia.csv");
})();
const limitArg = (() => {
  const i = args.indexOf("--limit");
  return i !== -1 ? parseInt(args[i + 1], 10) : Infinity;
})();

// ── CSV parse/write ───────────────────────────────────────────────────────────

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const row = {};
    let cur = "", inQ = false, col = 0;
    for (const c of lines[i]) {
      if (c === '"' && !inQ) { inQ = true; }
      else if (c === '"' && inQ) { inQ = false; }
      else if (c === "," && !inQ) { row[headers[col]] = cur; cur = ""; col++; }
      else { cur += c; }
    }
    row[headers[col]] = cur;
    rows.push(row);
  }
  return { headers, rows };
}

const LIST_FIELDS = new Set([
  "care_types","specialties","languages","room_types","feature_tags","other_tags",
  "hero_badges","services_included","amenities","allied_health","nearby_hospitals",
  "faq_items","gallery_image_urls","gallery_photo_ids","gallery_photo_local_paths",
]);

function csvEscape(key, val) {
  if (val === null || val === undefined) return "";
  const s = Array.isArray(val) ? val.join(LIST_FIELDS.has(key) ? "|" : "; ") : String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function writeCSV(filePath, headers, rows) {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map(h => csvEscape(h, row[h] ?? "")).join(","));
  }
  writeFileSync(filePath, lines.join("\n") + "\n", "utf8");
}

// ── Vacancy scan ──────────────────────────────────────────────────────────────

const VACANCY_POSITIVE = [
  "room available", "rooms available", "bed available", "beds available",
  "vacancy available", "vacancies available", "we have availability",
  "accepting enquiries", "accepting new residents", "contact us to arrange",
  "enquire now", "currently accepting",
];
const VACANCY_NEGATIVE = [
  "no vacancy", "no vacancies", "no rooms available", "currently full",
  "no beds available", "wait list only", "waitlist only", "at full capacity",
  "not currently accepting",
];

function detectVacancy(text) {
  const lower = text.toLowerCase();
  for (const phrase of VACANCY_NEGATIVE) {
    if (lower.includes(phrase)) return "no";
  }
  for (const phrase of VACANCY_POSITIVE) {
    if (lower.includes(phrase)) return "yes";
  }
  return "unknown";
}

async function scanWebsite(page, url) {
  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 20000 });
    const text = await page.evaluate(() => document.body.innerText);
    const vacancy = detectVacancy(text);

    // Also try /vacancies or /availability sub-page if unknown
    if (vacancy === "unknown") {
      const subPages = ["/vacancies", "/availability", "/rooms", "/accommodation"];
      for (const sub of subPages) {
        try {
          const subUrl = url.replace(/\/$/, "") + sub;
          await page.goto(subUrl, { waitUntil: "networkidle2", timeout: 10000 });
          const subText = await page.evaluate(() => document.body.innerText);
          const subVacancy = detectVacancy(subText);
          if (subVacancy !== "unknown") return { vacancy: subVacancy, sourceUrl: subUrl };
        } catch { /* sub-page doesn't exist, skip */ }
      }
    }

    return { vacancy, sourceUrl: url };
  } catch (err) {
    return { vacancy: "unknown", sourceUrl: url, error: err.message };
  }
}

async function scanMACRooms(page, govUrl) {
  try {
    const roomsUrl = govUrl.split("?")[0] + "/rooms-and-cost";
    await page.goto(roomsUrl, { waitUntil: "networkidle2", timeout: 20000 });
    const text = await page.evaluate(() => document.body.innerText);

    // Check room availability on MAC
    const hasAvailable = /currently available/i.test(text);
    const hasNone = /not currently available/i.test(text);

    // Extract all DAP amounts
    const dapAmounts = [...text.matchAll(/Max\. daily room payment\nor\nMax\. refundable room deposit\n\$(\d[\d,.]+)/g)]
      .map(m => parseFloat(m[1].replace(/,/g, "")));

    // Extract RAD amounts (larger numbers like $450,000)
    const radAmounts = [...text.matchAll(/\$(\d{2,3},\d{3})/g)]
      .map(m => parseFloat(m[1].replace(/,/g, "")))
      .filter(n => n > 10000); // RAD values are large

    // Room type names
    const lines = text.split("\n");
    const roomTypes = [];
    for (let i = 0; i < lines.length - 1; i++) {
      if (/^(Single room|Shared room|Studio|Double room)/i.test(lines[i + 1])) {
        const candidate = lines[i].trim();
        if (candidate && candidate.length < 60 && !/^\$|^\d|^Max|^Show|^Size|^Avail/.test(candidate)) {
          roomTypes.push(candidate);
        }
      }
    }

    return {
      mac_rooms_available: hasAvailable && !hasNone ? "yes" : hasNone && !hasAvailable ? "no" : "unknown",
      dap_from: dapAmounts.length ? Math.min(...dapAmounts).toFixed(2) : null,
      dap_to:   dapAmounts.length ? Math.max(...dapAmounts).toFixed(2) : null,
      rad_from: radAmounts.length ? Math.min(...radAmounts).toFixed(0) : null,
      rad_to:   radAmounts.length ? Math.max(...radAmounts).toFixed(0) : null,
      room_types: roomTypes.length ? roomTypes : null,
    };
  } catch {
    return {};
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Vacancy + Room Cost Scanner ===");

  if (!existsSync(inputFile)) {
    console.error(`Input file not found: ${inputFile}`);
    process.exit(1);
  }

  const { headers, rows } = parseCSV(readFileSync(inputFile, "utf8"));
  console.log(`Loaded ${rows.length} facilities from ${inputFile}`);

  const toScan = rows.slice(0, limitArg);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

  let done = 0;

  for (let i = 0; i < toScan.length; i++) {
    const row = toScan[i];
    const progress = `[${i + 1}/${toScan.length}]`;
    const name = row.name || `Row ${i + 1}`;

    process.stdout.write(`${progress} ${name} ... `);

    const checkedAt = new Date().toISOString();

    // 1 — scan facility website for vacancies
    let vacancyResult = { vacancy: "unknown", sourceUrl: "" };
    if (row.website) {
      vacancyResult = await scanWebsite(page, row.website);
    }

    // 2 — scan My Aged Care rooms tab for availability + costs
    let macRooms = {};
    if (row.government_listing_url) {
      macRooms = await scanMACRooms(page, row.government_listing_url);
    }

    // Update row
    row.website_says_vacancies = vacancyResult.vacancy;
    row.website_checked_at     = checkedAt;
    row.website_source_url     = vacancyResult.sourceUrl || "";
    row.availability_status    = macRooms.mac_rooms_available || vacancyResult.vacancy;

    if (macRooms.dap_from && !row.dap_from) row.dap_from = macRooms.dap_from;
    if (macRooms.dap_to   && !row.dap_to)   row.dap_to   = macRooms.dap_to;
    if (macRooms.rad_from && !row.rad_from) row.rad_from = macRooms.rad_from;
    if (macRooms.rad_to   && !row.rad_to)   row.rad_to   = macRooms.rad_to;
    if (macRooms.room_types?.length && !row.room_types) {
      row.room_types = macRooms.room_types.join("|");
    }

    console.log(`vacancy=${vacancyResult.vacancy}  mac_rooms=${macRooms.mac_rooms_available || "?"}  dap=$${macRooms.dap_from || row.dap_from || "?"}`);
    done++;

    // Save progress every 10 rows
    if (done % 10 === 0) {
      writeCSV(inputFile, headers, rows);
      console.log(`  [saved progress: ${done} done]`);
    }
  }

  await browser.close();

  // Final save
  writeCSV(inputFile, headers, rows);
  console.log(`\n=== Done ===`);
  console.log(`Scanned: ${done}`);
  console.log(`Updated: ${inputFile}`);
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
