import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required (the app runtime connects via the pooler, not DIRECT_URL)");
}

const globalForDb = globalThis as unknown as {
  pg?: postgres.Sql;
};

// Reused across hot reloads in dev so `next dev` doesn't open a new
// connection pool on every module re-evaluation.
const client =
  globalForDb.pg ??
  // `prepare: false` is required against Supabase's transaction-mode pooler
  // (port 6543, what DATABASE_URL points at) -- it doesn't support prepared
  // statements.
  postgres(process.env.DATABASE_URL, { prepare: false });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pg = client;
}

export const db = drizzle(client, { schema });

export type Db = PostgresJsDatabase<typeof schema>;
