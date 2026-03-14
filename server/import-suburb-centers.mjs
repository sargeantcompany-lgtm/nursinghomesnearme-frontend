import XLSX from "xlsx";
import { pool } from "./db.mjs";

const sourcePath = process.argv[2];

if (!sourcePath) {
  console.error("Usage: node server/import-suburb-centers.mjs <csv-or-xlsx-path>");
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

function buildBatchInsert(rows) {
  const values = [];
  const placeholders = rows.map((row, index) => {
    const offset = index * 5;
    values.push(row.suburb, row.state, row.postcode, row.latitude, row.longitude);
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`;
  });

  return {
    text: `
      INSERT INTO suburb_location_centers (suburb, state, postcode, latitude, longitude)
      VALUES ${placeholders.join(", ")}
    `,
    values,
  };
}

const workbook = XLSX.readFile(sourcePath, { raw: false });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

const rows = rawRows
  .map((row) => ({
    suburb: getValue(row, "suburb", "Suburb"),
    state: getValue(row, "state", "State") || "QLD",
    postcode: getValue(row, "postcode", "Postcode"),
    latitude: getNumber(row, "lat", "latitude", "Latitude"),
    longitude: getNumber(row, "lng", "lon", "longitude", "Longitude"),
  }))
  .filter((row) => row.suburb && row.postcode && row.latitude != null && row.longitude != null);

if (!rows.length) {
  console.error("No valid suburb rows found.");
  process.exit(1);
}

const client = await pool.connect();

try {
  await client.query("BEGIN");
  await client.query("TRUNCATE TABLE suburb_location_centers RESTART IDENTITY");

  const batchSize = 1000;
  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    const insert = buildBatchInsert(batch);
    await client.query(insert.text, insert.values);
  }

  await client.query("COMMIT");
  console.log(`Suburb import complete. Loaded ${rows.length} rows.`);
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
