import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn(
    "⚠️  DATABASE_URL is not set — database operations will fail until a database is provisioned.",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? "postgresql://localhost/taxappeal_placeholder" });
export const db = drizzle(pool, { schema });

export * from "./schema";
