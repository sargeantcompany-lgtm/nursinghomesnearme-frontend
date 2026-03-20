#!/usr/bin/env node
/**
 * scrape-facilities.mjs
 *
 * Scrapes each facility URL from facilities_urls.txt using Puppeteer (headless Chrome).
 * No API key needed — runs entirely on your machine.
 *
 * Usage:
 *   node scripts/scrape-facilities.mjs
 *   node scripts/scrape-facilities.mjs --state QLD   (filter by state)
 *   node scripts/scrape-facilities.mjs --limit 20    (only scrape first N)
 *
 * Output:
 *   scripts/facilities_australia.csv   — all scraped data
 *   scripts/facilities_errors.csv      — URLs that failed
 */

import puppeteer from "puppeteer";
import { writeFileSync, appendFileSync, existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const URLS_FILE = join(__dirname, "facilities_urls.txt");
const OUTPUT    = join(__dirname, "facilities_australia.csv");
const ERRORS    = join(__dirname, "facilities_errors.csv");

// ── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const stateFilter = (() => {
  const i = args.indexOf("--state");
  return i !== -1 ? args[i + 1]?.toUpperCase() : null;
})();
const limitArg = (() => {
  const i = args.indexOf("--limit");
  return i !== -1 ? parseInt(args[i + 1], 10) : Infinity;
})();
const seedsFile = (() => {
  const i = args.indexOf("--seeds");
  return i !== -1 ? args[i + 1] : null;
})();

// ── CSV ───────────────────────────────────────────────────────────────────────

const CSV_HEADERS = [
  // Identity
  "name", "provider_name", "abn", "slug",
  // Contact
  "email", "phone", "website",
  // Location
  "government_listing_url", "address_line_1", "address_line_2",
  "suburb", "state", "postcode", "latitude", "longitude",
  // Meta
  "status", "source_primary", "facility_type", "beds",
  // Descriptions
  "one_line_description", "long_description", "overview_heading",
  "provider_overview", "accommodation_summary", "pricing_summary",
  // Care
  "care_types", "specialties", "languages", "room_types",
  // Tags
  "feature_tags", "other_tags", "hero_badges",
  // Services
  "services_included", "amenities", "allied_health",
  // Food
  "food_highlights",
  // Logistics
  "visiting_hours", "admissions_process", "waiting_list_summary",
  "transport_notes", "nearby_hospitals",
  // FAQ / reviews
  "faq_items", "review_summary", "review_count",
  // Photos
  "primary_photo_url", "gallery_image_urls",
  // Pricing
  "rad_from", "rad_to", "dap_from", "dap_to",
  // Vacancy
  "availability_status", "active_vacancies",
  "website_says_vacancies", "website_checked_at", "website_source_url",
  "facility_confirmed_vacancies", "facility_confirmed_at",
  "facility_confirmation_source", "conflict_flag",
  // Admin
  "verified_at", "last_profile_scan_at", "internal_notes", "facility_row_id",
  "primary_photo_id", "gallery_photo_ids",
  "primary_photo_local_path", "gallery_photo_local_paths",
];

// List fields use | separator per spec
const LIST_FIELDS = new Set([
  "care_types","specialties","languages","room_types","feature_tags","other_tags",
  "hero_badges","services_included","amenities","allied_health","nearby_hospitals",
  "faq_items","gallery_image_urls","gallery_photo_ids","gallery_photo_local_paths",
]);

function csvEscape(key, val) {
  if (val === null || val === undefined) return "";
  const s = Array.isArray(val)
    ? val.join(LIST_FIELDS.has(key) ? "|" : "; ")
    : String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function writeRow(filePath, obj) {
  const row = CSV_HEADERS.map((h) => csvEscape(h, obj[h])).join(",");
  appendFileSync(filePath, row + "\n", "utf8");
}

// ── Extract data from a specific tab ─────────────────────────────────────────

async function scrapeTab(page, url, tab) {
  await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
  const body = await page.evaluate(() => document.body.innerText);

  const num = (pattern) => {
    const m = body.match(pattern);
    return m ? parseInt(m[1]) : null;
  };
  const dollar = (pattern) => {
    const m = body.match(pattern);
    return m ? m[1] : null;
  };

  if (tab === "summary") {
    // Provider name sits between the nav breadcrumb and "Print"
    const provMatch = body.match(/Find a provider\nSearch\n([^\n]+)\nPrint/);
    const providerName = provMatch ? provMatch[1].trim() : null;

    // Name = h1
    const nameMatch = body.match(/^([^\n]+)\nOverall Star Rating/m);
    const name = nameMatch ? nameMatch[1].trim() : null;

    // Description = first long paragraph after the name heading
    const descMatch = body.match(/Overall Star Rating\n([^\n]{80,})/);
    const description = descMatch ? descMatch[1].trim() : null;

    // Contact details — exclude the My Aged Care helpline 1800 200 422
    const phoneMatch = body.match(/(\(0\d\)\s?\d{4}\s?\d{4}|0\d\s?\d{4}\s?\d{4}|04\d{2}\s?\d{3}\s?\d{3}|1[38]00\s?\d{3}\s?\d{3})/g);
    const phone = phoneMatch ? phoneMatch.find(p => !p.replace(/\s/g,"").includes("1800200422")) ?? null : null;

    const emailMatch = body.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const email = emailMatch ? emailMatch[1] : null;

    // Website — external link
    const websiteEl = await page.evaluate(() => {
      const a = [...document.querySelectorAll('a[href^="http"]')]
        .find(a => !a.href.includes("myagedcare.gov.au") && !a.href.includes("google.com") && a.href.length > 15);
      return a?.href ?? null;
    });

    // Address: "111 Street, SUBURB 1234 STATE"
    let addressLine1 = null, suburb = null, postcode = null, state = null;
    const addrMatch = body.match(/(\d+[^\n,]+),\s*([A-Z][A-Z ]+)\s+(\d{4})\s+(QLD|NSW|VIC|WA|SA|TAS|NT|ACT)/);
    if (addrMatch) {
      addressLine1 = addrMatch[1].trim();
      suburb       = addrMatch[2].trim();
      postcode     = addrMatch[3];
      state        = addrMatch[4];
    } else {
      const m = body.match(/(\d{4})\s+(QLD|NSW|VIC|WA|SA|TAS|NT|ACT)/);
      if (m) { postcode = m[1]; state = m[2]; }
    }

    // Care types
    const careTypes = [];
    if (body.includes("Permanent residential")) careTypes.push("Permanent residential");
    if (body.includes("Residential respite") || body.includes("respite")) careTypes.push("Residential respite");
    if (body.includes("dementia") || body.includes("Dementia")) careTypes.push("Dementia");
    if (body.includes("Palliative")) careTypes.push("Palliative");

    // Specialisations
    const specSection = body.match(/Specialisations\n([\s\S]*?)(?=More about specialisations)/);
    const specialisations = [];
    if (specSection && !specSection[1].includes("has not listed")) {
      specSection[1].trim().split("\n").filter(l => l.trim() && !l.includes("Bethanie")).forEach(s => specialisations.push(s.trim()));
    }

    // Survey results from summary page
    const feelSafe = num(/Do you feel safe here\?\n(\d+)%/);
    const getCare  = num(/Do you get the care you need\?\n(\d+)%/);
    const recommend = num(/(\d+)%[^\n]*would recommend/i);

    // Room costs from summary (min DAP across rooms)
    const dapAmounts = [...body.matchAll(/Max\. daily room payment\nor\nMax\. refundable room deposit\n\$(\d[\d,.]+)/g)].map(m => parseFloat(m[1].replace(/,/g, "")));
    const dap_from = dapAmounts.length ? Math.min(...dapAmounts).toFixed(2) : null;
    const dap_to   = dapAmounts.length ? Math.max(...dapAmounts).toFixed(2) : null;

    return {
      name, providerName, phone, email, website: websiteEl,
      addressLine1, suburb, state, postcode,
      description, careTypes, specialisations,
      dap_from, dap_to,
      percentFeelSafe: feelSafe,
      percentGetCareTheyNeed: getCare,
      percentWouldRecommend: recommend,
    };
  }

  if (tab === "food") {
    const foodSpend = dollar(/\$(\d+)\nspent on food per resident per day/);
    const foodSatisfaction = num(/(\d+)%\npositive feedback on food/);
    const foodOnsite = body.includes("100% on-site");
    return { foodSpendPerResidentPerDay: foodSpend, residentFoodSatisfactionPercent: foodSatisfaction, foodPreparedOnsite: foodOnsite };
  }

  if (tab === "staffing") {
    const totalCare = num(/(\d+)\s*minutes?\nEqual to target|(\d+)\s*minutes?\nAbove target|(\d+)\s*minutes?\nBelow target/);
    // More reliable: look for "NNN minutes" before "Target"
    const careMatch = body.match(/(\d+) minutes\n(?:Equal to|Above|Below) target/);
    const totalCareMinutesPerDay = careMatch ? parseInt(careMatch[1]) : null;
    const rnMatch = body.match(/(\d+) minutes?\ndelivered by Registered nurse/i) ||
                    body.match(/Registered nurse\n(\d+) minutes/i);
    const rnMinutesPerDay = rnMatch ? parseInt(rnMatch[1]) : null;
    const has24hrRN = body.includes("24 hours a day") || body.includes("24-hour registered nurse") || body.includes("registered nurse is available 24") ? true : false;
    return { totalCareMinutesPerDay, rnMinutesPerDay, has24hrRN };
  }

  if (tab === "care") {
    const clinicalServices = [];
    if (body.includes("nursing")) clinicalServices.push("Nursing");
    if (body.includes("medication management")) clinicalServices.push("Medication management");
    if (body.includes("physiotherapy") || body.includes("Physiotherapy")) clinicalServices.push("Physiotherapy");
    if (body.includes("occupational therapy") || body.includes("Occupational therapy")) clinicalServices.push("Occupational therapy");
    if (body.includes("podiatry") || body.includes("Podiatry")) clinicalServices.push("Podiatry");
    if (body.includes("speech therapy") || body.includes("Speech therapy")) clinicalServices.push("Speech therapy");
    if (body.includes("dietitian") || body.includes("Dietitian")) clinicalServices.push("Dietitian");
    return { clinicalCareServices: clinicalServices };
  }

  if (tab === "rooms") {
    // Collect all room type names — lines followed by "Single room", "Shared room", "Studio"
    const roomLines = body.split("\n");
    const roomTypes = [];
    for (let i = 0; i < roomLines.length - 1; i++) {
      if (/^(Single room|Shared room|Studio|Double room)/i.test(roomLines[i + 1])) {
        const candidate = roomLines[i].trim();
        if (candidate && candidate.length < 60 && !/^\$|^\d|^Max|^Show|^Size/.test(candidate)) {
          roomTypes.push(candidate);
        }
      }
    }

    // RAD amounts — look for $NNN,NNN patterns near "refundable"
    const radAmounts = [...body.matchAll(/\$(\d{2,3},\d{3})/g)].map(m => parseFloat(m[1].replace(/,/g, "")));
    const rad_from = radAmounts.length ? Math.min(...radAmounts).toFixed(0) : null;
    const rad_to   = radAmounts.length ? Math.max(...radAmounts).toFixed(0) : null;

    const roomsAvailable = body.includes("rooms available") || body.includes("room available");
    return { roomTypes, rad_from, rad_to, roomsCurrentlyAvailable: roomsAvailable };
  }

  return {};
}

// ── Scrape all tabs for a facility ────────────────────────────────────────────

const TABS = [
  { path: "",                  key: "summary" },
  { path: "/rooms-and-cost",   key: "rooms"   },
  { path: "/care-and-services",key: "care"    },
  { path: "/food-and-nutrition",key: "food"   },
  { path: "/staffing",         key: "staffing"},
];

function makeSlug(name) {
  if (!name) return "";
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function scrapeAllTabs(page, baseUrl) {
  const raw = { government_listing_url: baseUrl };

  for (const { path, key } of TABS) {
    const url = baseUrl + path;
    try {
      const data = await scrapeTab(page, url, key);
      for (const [k, v] of Object.entries(data)) {
        if (v !== null && v !== undefined && v !== "" &&
            !(Array.isArray(v) && v.length === 0) &&
            raw[k] === undefined) {
          raw[k] = v;
        }
      }
    } catch (err) {
      console.error(`    Tab ${key} error: ${err.message}`);
    }
  }

  // Map raw fields → CSV columns + set defaults
  return {
    // Identity
    name:               raw.name ?? "",
    provider_name:      raw.providerName ?? "",
    abn:                raw.abn ?? "",
    slug:               makeSlug(raw.name),
    // Contact
    email:              raw.email ?? "",
    phone:              raw.phone ?? "",
    website:            raw.website ?? "",
    // Location
    government_listing_url: raw.government_listing_url,
    address_line_1:     raw.addressLine1 ?? "",
    address_line_2:     "",
    suburb:             raw.suburb ?? "",
    state:              raw.state ?? "",
    postcode:           raw.postcode ?? "",
    latitude:           "",
    longitude:          "",
    // Meta
    status:             "active",
    source_primary:     "myagedcare",
    facility_type:      "residential_aged_care",
    beds:               raw.beds ?? "",
    // Descriptions
    one_line_description:  "",
    long_description:      raw.description ?? "",
    overview_heading:      "",
    provider_overview:     "",
    accommodation_summary: "",
    pricing_summary:       "",
    // Care
    care_types:         raw.careTypes ?? [],
    specialties:        raw.specialisations ?? [],
    languages:          raw.languages ?? [],
    room_types:         raw.roomTypes ?? [],
    // Tags
    feature_tags:       "",
    other_tags:         "",
    hero_badges:        "",
    // Services
    services_included:  raw.clinicalCareServices ?? [],
    amenities:          raw.amenities ?? [],
    allied_health:      raw.alliedHealth ?? [],
    // Food
    food_highlights:    raw.foodSpendPerResidentPerDay
                          ? `$${raw.foodSpendPerResidentPerDay}/day spend; ${raw.residentFoodSatisfactionPercent ?? "?"}% satisfaction; ${raw.foodPreparedOnsite ? "prepared onsite" : "offsite"}`
                          : "",
    // Logistics
    visiting_hours:       raw.visitingHours ?? "",
    admissions_process:   raw.admissionsProcess ?? "",
    waiting_list_summary: "",
    transport_notes:      "",
    nearby_hospitals:     "",
    // FAQ / reviews
    faq_items:       "",
    review_summary:  "",
    review_count:    "",
    // Photos
    primary_photo_url:  "",
    gallery_image_urls: "",
    // Pricing
    rad_from: raw.rad_from ?? "",
    rad_to:   raw.rad_to ?? "",
    dap_from: raw.dap_from ?? "",
    dap_to:   raw.dap_to ?? "",
    // Vacancy
    availability_status:          "unknown",
    active_vacancies:             "",
    website_says_vacancies:       "unknown",
    website_checked_at:           "",
    website_source_url:           "",
    facility_confirmed_vacancies: "unknown",
    facility_confirmed_at:        "",
    facility_confirmation_source: "",
    conflict_flag:                "",
    // Admin
    verified_at:              "",
    last_profile_scan_at:     new Date().toISOString(),
    internal_notes:           "",
    facility_row_id:          "",
    primary_photo_id:         "",
    gallery_photo_ids:        "",
    primary_photo_local_path: "",
    gallery_photo_local_paths:"",
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== My Aged Care Scraper (Puppeteer) ===");

  if (!existsSync(URLS_FILE)) {
    console.error(`No URL file found at ${URLS_FILE}`);
    console.error("Run the discover step first.");
    process.exit(1);
  }

  let urls;

  if (seedsFile) {
    // Load government_listing_url from seeds CSV, skip rows without one
    const seedData = readFileSync(seedsFile, "utf8").trim().split("\n");
    const headers = seedData[0].split(",").map(h => h.trim().replace(/"/g,""));
    const urlCol = headers.indexOf("government_listing_url");
    urls = seedData.slice(1)
      .map(row => {
        const cols = row.split(",").map(c => c.trim().replace(/"/g,""));
        return cols[urlCol] ?? "";
      })
      .map(u => u.split("?")[0].trim())
      .filter(u => u.includes("myagedcare.gov.au"));
    console.log(`Loaded ${urls.length} URLs from seeds: ${seedsFile}`);
  } else {
    if (!existsSync(URLS_FILE)) {
      console.error(`No URL file found at ${URLS_FILE}`);
      process.exit(1);
    }
    urls = readFileSync(URLS_FILE, "utf8")
      .split("\n")
      .map(l => l.split("?")[0].trim())
      .filter(Boolean);
    console.log(`Loaded ${urls.length} URLs`);
  }

  if (stateFilter) console.log(`State filter: ${stateFilter} (applied after scraping address)`);
  if (limitArg !== Infinity) {
    urls = urls.slice(0, limitArg);
    console.log(`Limited to first ${limitArg}`);
  }

  // Write CSV header
  writeFileSync(OUTPUT, CSV_HEADERS.join(",") + "\n", "utf8");
  writeFileSync(ERRORS, "url,error\n", "utf8");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );

  let success = 0, errors = 0, skipped = 0;

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const progress = `[${i + 1}/${urls.length}]`;

    try {
      process.stdout.write(`${progress} ${url} ... `);
      const data = await scrapeAllTabs(page, url);

      // Apply state filter if set
      if (stateFilter && data.state?.toUpperCase() !== stateFilter) {
        skipped++;
        console.log(`skipped (${data.state || "unknown state"})`);
        continue;
      }

      writeRow(OUTPUT, data);
      success++;
      const fields = Object.keys(data).filter(k => data[k] !== null && data[k] !== undefined && data[k] !== "").length;
      console.log(`OK (${fields} fields, ${data.state || "?"} ${data.suburb || ""})`);
    } catch (err) {
      errors++;
      console.error(`ERROR: ${err.message}`);
      appendFileSync(ERRORS, `"${url}","${err.message.replace(/"/g, '""')}"\n`);
    }
  }

  await browser.close();

  console.log("\n=== Done ===");
  console.log(`Success: ${success}`);
  if (skipped) console.log(`Skipped (wrong state): ${skipped}`);
  console.log(`Errors:  ${errors}`);
  console.log(`CSV:     ${OUTPUT}`);
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
