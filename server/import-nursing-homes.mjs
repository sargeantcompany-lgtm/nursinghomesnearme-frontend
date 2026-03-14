import XLSX from "xlsx";
import { query } from "./db.mjs";

const sourcePath = process.argv[2];

if (!sourcePath) {
  console.error("Usage: node server/import-nursing-homes.mjs <csv-or-xlsx-path>");
  process.exit(1);
}

function getValue(row, ...keys) {
  for (const key of keys) {
    const value = row[key];
    if (value != null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return "";
}

function getNumber(row, ...keys) {
  const value = getValue(row, ...keys);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getFirstEmail(row, ...keys) {
  const value = getValue(row, ...keys);
  if (!value) return "";
  return (
    value
      .split(/[;,]/)
      .map((part) => part.trim())
      .find((part) => part.includes("@")) || ""
  );
}

const workbook = XLSX.readFile(sourcePath, { raw: false });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

let created = 0;
let updated = 0;
let skipped = 0;

for (const row of rows) {
  const name = getValue(row, "name", "Name", "facility_name", "Facility Name");
  const suburb = getValue(row, "suburb", "Suburb");
  const state = getValue(row, "state", "State") || "QLD";
  const postcode = getValue(row, "postcode", "Postcode", "post_code");

  if (!name || !suburb || !postcode) {
    skipped++;
    continue;
  }

  const oneLineDescription = getValue(row, "oneLineDescription", "one_line_description", "One Line Description");
  const description = getValue(row, "description", "Description");
  const addressLine1 = getValue(row, "addressLine1", "address_line", "address", "Address", "street_address");
  const latitude = getNumber(row, "latitude", "lat", "Latitude");
  const longitude = getNumber(row, "longitude", "lng", "lon", "Longitude");
  const phone = getValue(row, "phone", "Phone");
  const website = getValue(row, "website", "Website", "source_url", "Source URL");
  const email = getFirstEmail(row, "email", "Email");
  const status = getValue(row, "status", "Status") || "ACTIVE";
  const category = getValue(row, "category", "Category");
  const primaryImageUrl = getValue(row, "primaryImageUrl", "primary_image_url", "Primary Image URL");
  const otherTags = category ? [category] : [];

  const existing = await query(
    `SELECT id FROM nursing_homes
     WHERE LOWER(name) = LOWER($1) AND LOWER(suburb) = LOWER($2) AND postcode = $3
     LIMIT 1`,
    [name, suburb, postcode],
  );

  if (existing.rows[0]) {
    await query(
      `UPDATE nursing_homes
       SET one_line_description = COALESCE(NULLIF($2, ''), one_line_description),
           description = COALESCE(NULLIF($3, ''), description),
           address_line1 = COALESCE(NULLIF($4, ''), address_line1),
           state = COALESCE(NULLIF($5, ''), state),
           latitude = COALESCE($6, latitude),
           longitude = COALESCE($7, longitude),
           phone = COALESCE(NULLIF($8, ''), phone),
           website = COALESCE(NULLIF($9, ''), website),
           email = COALESCE(NULLIF($10, ''), email),
           status = COALESCE(NULLIF($11, ''), status),
           primary_image_url = COALESCE(NULLIF($12, ''), primary_image_url),
           other_tags = CASE WHEN $13::jsonb = '[]'::jsonb THEN other_tags ELSE $13::jsonb END,
           updated_at = NOW()
       WHERE id = $1`,
      [
        existing.rows[0].id,
        oneLineDescription,
        description,
        addressLine1,
        state,
        latitude,
        longitude,
        phone,
        website,
        email,
        status,
        primaryImageUrl,
        JSON.stringify(otherTags),
      ],
    );
    updated++;
  } else {
    await query(
      `INSERT INTO nursing_homes (
        name, one_line_description, description, address_line1, suburb, state, postcode,
        latitude, longitude, phone, website, email, status, primary_image_url, other_tags
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        name,
        oneLineDescription || null,
        description || null,
        addressLine1 || null,
        suburb,
        state,
        postcode,
        latitude,
        longitude,
        phone || null,
        website || null,
        email || null,
        status,
        primaryImageUrl || null,
        JSON.stringify(otherTags),
      ],
    );
    created++;
  }
}

console.log(`Nursing-home import complete. Created ${created}, updated ${updated}, skipped ${skipped}.`);
