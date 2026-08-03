import { boolean, integer, numeric, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const utcMs = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

// `mode: "number"` is required on every money/qty/ratio column -- without
// it, postgres-js returns `numeric` as a string, and `"7.60" * 60` is a
// silent, live bug (see CLAUDE.md).
const money = (name: string) => numeric(name, { precision: 12, scale: 4, mode: "number" });
const qty = (name: string) => numeric(name, { precision: 14, scale: 4, mode: "number" });
const ratio = (name: string) => numeric(name, { precision: 10, scale: 6, mode: "number" });

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

// One row per closed lot (see CLAUDE.md's FIFO-boundary decision, once the
// Schwab sync/FIFO-reconstruction feature lands) -- not yet populated by
// anything real; this table exists now so the Dashboard/Trades UI has a
// real (currently empty) source instead of mock data baked into the app.
export const trades = pgTable("trades", {
  id: id(),
  // Local Y-M-D / H:M:S strings, not `timestamptz` -- see CLAUDE.md's
  // timezone-conversion trap; these avoid it by never touching UTC math.
  date: text("date").notNull(),
  time: text("time").notNull(),
  symbol: text("symbol").notNull(),
  side: text("side", { enum: ["long", "short"] }).notNull(),
  qty: qty("qty").notNull(),
  entry: money("entry").notNull(),
  exit: money("exit").notNull(),
  pnl: money("pnl").notNull(),
  r: ratio("r"),
  setup: text("setup"),
  durationSeconds: integer("duration_seconds"),
  status: text("status", { enum: ["closed", "working", "cancelled"] }).notNull(),
  hasNote: boolean("has_note").notNull().default(false),
  mistakes: text("mistakes").array().notNull().default([]),
  habits: text("habits").array().notNull().default([]),
  rating: integer("rating"),
  target: money("target"),
  stop: money("stop"),
  mae: money("mae"),
  mfe: money("mfe"),
});
