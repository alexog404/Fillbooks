import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const utcMs = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

// Single-tenant app -- no per-user scoping anywhere in this schema (no
// auth, by design). One row per broker, upserted, never appended.
export const brokerConnections = pgTable(
  "broker_connections",
  {
    id: id(),
    broker: text("broker").notNull(),
    refreshTokenEnc: text("refresh_token_enc"),
    accessTokenEnc: text("access_token_enc"),
    // The *refresh* token's expiry (now + 7d at connect/refresh time), not
    // the access token's -- the access token's ~30-minute freshness is an
    // internal implementation detail refreshed on demand via the stored
    // refresh token, never persisted on its own.
    tokenExpiresAt: utcMs("token_expires_at"),
    lastSyncAt: utcMs("last_sync_at"),
    status: text("status", { enum: ["disconnected", "connected", "expired"] }),
  },
  (t) => [unique("broker_connections_broker_unique").on(t.broker)],
);
