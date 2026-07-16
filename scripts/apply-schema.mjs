// Applies prisma/schema.sql to a libSQL/Turso database.
// Works on any OS without the Turso CLI. Usage:
//   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node scripts/apply-schema.mjs
import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

if (!url) {
  console.error("TURSO_DATABASE_URL is not set.");
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(here, "..", "prisma", "schema.sql"), "utf-8");

const client = createClient({ url, authToken });
await client.executeMultiple(sql);
console.log("✓ Schema applied to", url.replace(/\?.*$/, ""));
