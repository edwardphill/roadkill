import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import * as schema from "./schema";

// DATABASE_URL set: real Postgres (production). Unset: embedded PGlite in ./.pglite,
// so the app runs locally with zero setup.
// Both drivers share the same Postgres query builder, so one type covers them.
type Db = NodePgDatabase<typeof schema>;

function createDb(): Db {
  const url = process.env.DATABASE_URL;
  if (url) return drizzlePg(url, { schema });
  return drizzlePglite(process.env.PGLITE_DIR ?? ".pglite", { schema }) as unknown as Db;
}

const globalForDb = globalThis as unknown as { db?: Db };
export const db = globalForDb.db ?? createDb();
if (process.env.NODE_ENV !== "production") globalForDb.db = db;

export { schema };
