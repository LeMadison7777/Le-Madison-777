import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";

const globalForPool = globalThis as typeof globalThis & { madclothesPool?: Pool };

export const pool = globalForPool.madclothesPool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 5_000,
  connectionTimeoutMillis: 10_000,
  ssl: { rejectUnauthorized: true },
});

if (!globalForPool.madclothesPool) {
  globalForPool.madclothesPool = pool;
  attachDatabasePool(pool);
}
