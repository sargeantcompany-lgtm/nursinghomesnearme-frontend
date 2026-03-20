#!/usr/bin/env node
/**
 * crawl-myagedcare.mjs
 *
 * Discovers all residential aged care facility pages on myagedcare.gov.au
 * using Firecrawl, extracts structured data from each, and writes to a CSV.
 *
 * Usage:
 *   # Test one facility:
 *   FIRECRAWL_API_KEY=your_key node scripts/crawl-myagedcare.mjs --test
 *
 *   # Step 1 — discover all facility URLs (saves to facilities_urls.txt):
 *   FIRECRAWL_API_KEY=your_key node scripts/crawl-myagedcare.mjs --discover
 *
 *   # Step 2 — scrape every URL in facilities_urls.txt:
 *   FIRECRAWL_API_KEY=your_key node scripts/crawl-myagedcare.mjs --scrape
 *
 *   # Full run (discover + scrape in one go):
 *   FIRECRAWL_API_KEY=your_key node scripts/crawl-myagedcare.mjs
 *
 * Output:
 *   scripts/facilities_urls.txt      — discovered URLs (resumable cache)
 *   scripts/facilities_australia.csv — scraped data
 *   scripts/facilities_errors.csv    — URLs that failed
 */

import { writeFileSync, appendFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ────────────────────────────────────────────────────────────────────

const API_KEY = process.env.FIRECRAWL_API_KEY;
if (!API_KEY) {
  console.error("ERROR: FIRECRAWL_API_KEY environment variable not set");
  console.error(
    "Run: FIRECRAWL_API_KEY=fc-xxxxx node scripts/crawl-myagedcare.mjs"
  );
  process.exit(1);
}

const FIRECRAWL = "https://api.firecrawl.dev/v1";
const MAC_BASE = "https://www.myagedcare.gov.au";
const OUTPUT = join(__dirname, "facilities_australia.csv");
const ERRORS = join(__dirname, "facilities_errors.csv");

// Delay between scrape calls to avoid rate limiting (ms)
const SCRAPE_DELAY = 1200;

// Max facilities to scrape (set to Infinity for all)
const MAX_FACILITIES = 10;

// ── CSV helpers ───────────────────────────────────────────────────────────────

const CSV_HEADERS = [
  "name",
  "providerName",
  "abn",
  "phone",
  "email",
  "website",
  "addressLine1",
  "suburb",
  "state",
  "postcode",
  "description",
  "careTypes",
  "specialisations",
  "roomTypes",
  "maxDailyRoomPayment",
  "maxRefundableDeposit",
  "roomsCurrentlyAvailable",
  "clinicalCareServices",
  "nonClinicalCareServices",
  "foodPreparedOnsite",
  "foodSpendPerResidentPerDay",
  "residentFoodSatisfactionPercent",
  "totalCareMinutesPerDay",
  "rnMinutesPerDay",
  "has24hrRN",
  "percentWouldRecommend",
  "percentFeelSafe",
  "percentGetCareTheyNeed",
  "governmentListingUrl",
];

function csvEscape(val) {
  if (val === null || val === undefined) return "";
  const s = Array.isArray(val) ? val.join("; ") : String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function writeRow(filePath, obj) {
  const row = CSV_HEADERS.map((h) => csvEscape(obj[h])).join(",");
  appendFileSync(filePath, row + "\n", "utf8");
}

// ── Firecrawl helpers ─────────────────────────────────────────────────────────

async function firecrawlPost(endpoint, body) {
  const res = await fetch(`${FIRECRAWL}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firecrawl ${endpoint} ${res.status}: ${text}`);
  }
  return res.json();
}

// ── Discover facility URLs by scraping search result pages ────────────────────
// Uses the free /scrape endpoint on paginated search results pages.
// Searches multiple Australian locations to ensure full coverage.

const SEARCH_LOCATIONS = [
  // ── Queensland first ──
  "Brisbane QLD 4000",
  "Gold Coast QLD 4217",
  "Sunshine Coast QLD 4558",
  "Townsville QLD 4810",
  "Cairns QLD 4870",
  "Toowoomba QLD 4350",
  "Rockhampton QLD 4700",
  "Mackay QLD 4740",
  "Bundaberg QLD 4670",
  "Hervey Bay QLD 4655",
  "Mount Isa QLD 4825",
  // ── NSW ──
  "Sydney NSW 2000",
  "Newcastle NSW 2300",
  "Wollongong NSW 2500",
  "Albury NSW 2640",
  "Wagga Wagga NSW 2650",
  "Tamworth NSW 2340",
  "Dubbo NSW 2830",
  "Orange NSW 2800",
  "Bathurst NSW 2795",
  "Lismore NSW 2480",
  "Broken Hill NSW 2880",
  // ── VIC ──
  "Melbourne VIC 3000",
  "Geelong VIC 3220",
  "Ballarat VIC 3350",
  "Bendigo VIC 3550",
  "Shepparton VIC 3630",
  "Mildura VIC 3500",
  "Warrnambool VIC 3280",
  "Wodonga VIC 3690",
  // ── WA ──
  "Perth WA 6000",
  "Mandurah WA 6210",
  "Bunbury WA 6230",
  "Geraldton WA 6530",
  "Kalgoorlie WA 6430",
  "Albany WA 6330",
  "Broome WA 6725",
  // ── SA ──
  "Adelaide SA 5000",
  "Mount Gambier SA 5290",
  "Whyalla SA 5600",
  "Port Augusta SA 5700",
  "Port Lincoln SA 5606",
  // ── TAS ──
  "Hobart TAS 7000",
  "Launceston TAS 7250",
  "Devonport TAS 7310",
  "Burnie TAS 7320",
  // ── NT / ACT ──
  "Darwin NT 0800",
  "Canberra ACT 2600",
];

async function scrapeSearchPage(location, page) {
  const encodedLocation = encodeURIComponent(location);
  const url = `${MAC_BASE}/find-a-provider/search/results?distance=500&searchType=aged-care-homes&location=${encodedLocation}&page=${page}&sort=relevance`;
  try {
    const data = await firecrawlPost("/scrape", {
      url,
      formats: ["links"],
    });
    const links = data?.links ?? data?.data?.links ?? [];
    return links
      .filter((l) => l && l.startsWith(MAC_BASE))
      .filter(isFacilityUrl)
      .map((l) => l.split("?")[0]); // strip query params
  } catch (err) {
    console.error(`  Error scraping ${location} page ${page}: ${err.message}`);
    return [];
  }
}

const URLS_CACHE = join(__dirname, "facilities_urls.txt");
const URLS_CSV = join(__dirname, "facilities_urls.csv");

async function discoverFacilityUrls() {
  const allUrls = new Set();

  // Resume from cache if it exists
  if (existsSync(URLS_CACHE)) {
    const { readFileSync } = await import("fs");
    const cached = readFileSync(URLS_CACHE, "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    cached.forEach((u) => allUrls.add(u));
    console.log(`  Resumed ${allUrls.size} URLs from cache: ${URLS_CACHE}`);
  }

  for (const location of SEARCH_LOCATIONS) {
    console.log(`\nSearching: ${location}`);
    let page = 1;
    let emptyPages = 0;

    while (emptyPages < 2) {
      process.stdout.write(`  Page ${page}... `);
      const urls = await scrapeSearchPage(location, page);

      const newUrls = urls.filter((u) => !allUrls.has(u));
      newUrls.forEach((u) => allUrls.add(u));

      console.log(
        `${urls.length} found (${newUrls.length} new, ${allUrls.size} total)`
      );

      if (urls.length === 0) {
        emptyPages++;
      } else {
        emptyPages = 0;
        // Save progress after each successful page
        writeFileSync(URLS_CACHE, Array.from(allUrls).join("\n") + "\n", "utf8");
      }

      page++;
      await sleep(SCRAPE_DELAY);
    }
  }

  const urlArray = Array.from(allUrls);
  writeFileSync(URLS_CACHE, urlArray.join("\n") + "\n", "utf8");
  writeFileSync(URLS_CSV, "governmentListingUrl\n" + urlArray.join("\n") + "\n", "utf8");
  console.log(`\nURL list saved to: ${URLS_CACHE}`);
  console.log(`URL CSV saved to:  ${URLS_CSV}`);
  return urlArray;
}

async function scrapeFacility(url) {
  const data = await firecrawlPost("/scrape", {
    url,
    formats: ["extract"],
    extract: {
      prompt:
        "Extract all available information about this residential aged care facility from the full page including all tabs (Summary, Rooms and costs, Care and services, Food and nutrition, Staffing). Be thorough.",
      schema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Full facility name" },
          providerName: {
            type: "string",
            description: "Organisation or provider name",
          },
          abn: { type: "string", description: "ABN number" },
          phone: { type: "string", description: "Main phone number" },
          email: { type: "string", description: "Contact email address" },
          website: {
            type: "string",
            description: "Facility own website URL (not myagedcare.gov.au)",
          },
          addressLine1: { type: "string", description: "Street address" },
          suburb: { type: "string", description: "Suburb" },
          state: {
            type: "string",
            description: "State abbreviation e.g. QLD, NSW, VIC",
          },
          postcode: { type: "string", description: "Postcode" },
          description: {
            type: "string",
            description: "About or overview description of the facility",
          },
          careTypes: {
            type: "array",
            items: { type: "string" },
            description:
              "Care types offered e.g. Permanent residential, Residential respite",
          },
          specialisations: {
            type: "array",
            items: { type: "string" },
            description: "Any specialisations listed e.g. Dementia",
          },
          roomTypes: {
            type: "array",
            items: { type: "string" },
            description: "Room type names e.g. Cottage Life, Single room",
          },
          maxDailyRoomPayment: {
            type: "string",
            description:
              "Maximum daily accommodation payment (DAP) in dollars e.g. $186.79",
          },
          maxRefundableDeposit: {
            type: "string",
            description:
              "Maximum refundable accommodation deposit (RAD) in dollars",
          },
          roomsCurrentlyAvailable: {
            type: "boolean",
            description: "Whether rooms are currently available",
          },
          clinicalCareServices: {
            type: "array",
            items: { type: "string" },
            description:
              "Clinical care services listed e.g. Nursing, Medication management",
          },
          nonClinicalCareServices: {
            type: "array",
            items: { type: "string" },
            description:
              "Non-clinical care services listed e.g. Personal care assistance, Continence management",
          },
          foodPreparedOnsite: {
            type: "boolean",
            description: "Whether food is prepared on-site (100% on-site)",
          },
          foodSpendPerResidentPerDay: {
            type: "string",
            description:
              "Food spend per resident per day in dollars e.g. $14",
          },
          residentFoodSatisfactionPercent: {
            type: "number",
            description:
              "Percentage of residents satisfied with food e.g. 84",
          },
          totalCareMinutesPerDay: {
            type: "number",
            description:
              "Total care minutes per resident per day e.g. 251",
          },
          rnMinutesPerDay: {
            type: "number",
            description:
              "Registered nurse minutes per resident per day e.g. 50",
          },
          has24hrRN: {
            type: "boolean",
            description: "Whether a registered nurse is available 24 hours a day",
          },
          percentWouldRecommend: {
            type: "number",
            description:
              "Percentage of residents surveyed who would recommend this home",
          },
          percentFeelSafe: {
            type: "number",
            description:
              "Percentage of residents surveyed who feel safe here",
          },
          percentGetCareTheyNeed: {
            type: "number",
            description:
              "Percentage of residents surveyed who feel they get the care they need",
          },
        },
      },
    },
  });

  // Firecrawl returns extract inside data.extract or data.data.extract
  const extract = data?.extract ?? data?.data?.extract ?? {};
  return extract;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Filter facility URLs ──────────────────────────────────────────────────────
// Facility pages follow: /find-a-provider/search/{provider-id}/aged-care-homes/{facility-id}
// Tabs are sub-paths: /rooms-and-cost, /care-and-services, etc.

function isFacilityUrl(url) {
  try {
    const path = new URL(url).pathname;
    const parts = path.split("/").filter(Boolean);
    // e.g. ["find-a-provider", "search", "g33bg6v2-...", "aged-care-homes", "churches-of-..."]
    return (
      parts.length === 5 &&
      parts[0] === "find-a-provider" &&
      parts[1] === "search" &&
      parts[3] === "aged-care-homes"
    );
  } catch {
    return false;
  }
}

// The tabs available on each facility page
const TABS = [
  "", // summary (root)
  "/rooms-and-cost",
  "/care-and-services",
  "/food-and-nutrition",
  "/staffing",
];

// ── Scrape all tabs for one facility and merge results ────────────────────────

async function scrapeAllTabs(baseUrl) {
  const merged = { governmentListingUrl: baseUrl };

  for (const tab of TABS) {
    const url = baseUrl + tab;
    try {
      const extract = await scrapeFacility(url);
      // Merge: only fill in fields that aren't already populated
      for (const [k, v] of Object.entries(extract)) {
        if (
          v !== null &&
          v !== undefined &&
          v !== "" &&
          !(Array.isArray(v) && v.length === 0) &&
          merged[k] === undefined
        ) {
          merged[k] = v;
        }
      }
      await sleep(SCRAPE_DELAY);
    } catch (err) {
      console.error(`    Tab ${tab || "(summary)"} error: ${err.message}`);
    }
  }

  return merged;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== My Aged Care Crawler ===");
  console.log(`Output: ${OUTPUT}`);

  // ── TEST MODE: scrape a single known facility first ──
  const TEST_URL =
    "https://www.myagedcare.gov.au/find-a-provider/search/g33bg6v2-churches-of-christ-in-queensland/aged-care-homes/churches-of-christ-homesteads-aged-care-0bcb3pzg";

  const testMode = process.argv.includes("--test");

  if (testMode) {
    console.log("\n--- TEST MODE: scraping one facility across all tabs ---");
    writeFileSync(OUTPUT, CSV_HEADERS.join(",") + "\n", "utf8");
    const result = await scrapeAllTabs(TEST_URL);
    writeRow(OUTPUT, result);
    console.log("\nExtracted fields:");
    for (const [k, v] of Object.entries(result)) {
      if (v !== undefined && v !== null && v !== "") {
        console.log(`  ${k}: ${JSON.stringify(v)}`);
      }
    }
    console.log(`\nCSV written to: ${OUTPUT}`);
    return;
  }

  const discoverMode = process.argv.includes("--discover");
  const scrapeMode = process.argv.includes("--scrape");

  let facilityUrls;

  if (scrapeMode) {
    // --scrape: load URLs from cache, skip discovery
    if (!existsSync(URLS_CACHE)) {
      console.error(`No URL cache found at ${URLS_CACHE}`);
      console.error("Run --discover first to build the URL list.");
      process.exit(1);
    }
    const { readFileSync } = await import("fs");
    facilityUrls = readFileSync(URLS_CACHE, "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, MAX_FACILITIES);
    console.log(`\nLoaded ${facilityUrls.length} URLs from cache: ${URLS_CACHE}`);
  } else {
    // Step 1: Discover all facility URLs by scraping search results pages
    console.log("\nDiscovering facility URLs from My Aged Care search pages...");
    facilityUrls = (await discoverFacilityUrls()).slice(0, MAX_FACILITIES);
    console.log(`\nTotal unique facility URLs to scrape: ${facilityUrls.length}`);
  }

  if (discoverMode) {
    console.log(`\nDiscover-only mode. URLs saved to: ${URLS_CACHE}`);
    console.log("Run with --scrape to scrape each facility.");
    return;
  }

  if (facilityUrls.length === 0) {
    console.error("\nNo facility URLs found. Try --discover first:");
    console.error("  node scripts/crawl-myagedcare.mjs --discover");
    process.exit(1);
  }

  // Step 2: Write CSV header
  writeFileSync(OUTPUT, CSV_HEADERS.join(",") + "\n", "utf8");
  writeFileSync(ERRORS, "url,error\n", "utf8");

  // Step 3: Scrape each facility
  let success = 0;
  let errors = 0;

  for (let i = 0; i < facilityUrls.length; i++) {
    const url = facilityUrls[i];
    const progress = `[${i + 1}/${facilityUrls.length}]`;

    try {
      process.stdout.write(`${progress} Scraping ${url} ... `);
      const extract = await scrapeAllTabs(url);
      writeRow(OUTPUT, extract);
      success++;
      console.log(`OK (${Object.keys(extract).filter(k => extract[k] !== null && extract[k] !== undefined && extract[k] !== '').length} fields)`);
    } catch (err) {
      errors++;
      console.error(`ERROR: ${err.message}`);
      appendFileSync(ERRORS, `"${url}","${err.message.replace(/"/g, '""')}"\n`);
    }

    // Delay between requests
    if (i < facilityUrls.length - 1) {
      await sleep(SCRAPE_DELAY);
    }
  }

  console.log("\n=== Done ===");
  console.log(`Success: ${success}`);
  console.log(`Errors:  ${errors}`);
  console.log(`CSV:     ${OUTPUT}`);
  if (errors > 0) {
    console.log(`Error log: ${ERRORS}`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
