import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { db } from "../src/db";

async function main() {
  const opts = { migrationsFolder: "./drizzle" };
  if (process.env.DATABASE_URL) await migratePg(db, opts);
  else await migratePglite(db as unknown as Parameters<typeof migratePglite>[0], opts);
  console.log("migrations applied");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
