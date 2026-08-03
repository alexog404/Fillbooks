import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import path from "node:path";

// Migrations run over DIRECT_URL (bypassing the pooler), the app runtime
// never does. `max: 1` because this connection exists only to run
// migrations sequentially and then close, not to be reused.
if (!process.env.DIRECT_URL) {
  throw new Error("DIRECT_URL is required to run migrations");
}

async function main() {
  const client = postgres(process.env.DIRECT_URL!, { max: 1 });
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  await client.end();
  console.log("Migrations applied.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
