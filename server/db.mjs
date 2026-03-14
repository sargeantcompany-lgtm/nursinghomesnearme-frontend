import pg from "pg";
import { env } from "./env.mjs";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.databaseUrl.includes("localhost")
    ? false
    : {
        rejectUnauthorized: false,
      },
});

export async function query(text, params = []) {
  return pool.query(text, params);
}
