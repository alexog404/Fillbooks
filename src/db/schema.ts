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

// One row per closed lot (see CLAUDE.md's FIFO-boundary decision). Derived
// data -- rebuilt from `executions` on every CSV import, not hand-edited
// directly except for the journal-ish fields below (mistakes, habits,
// rating, target, stop, mae, mfe), which a rebuild leaves untouched.
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

// Raw fills from an imported CSV statement -- insert-once, deduped, never
// mutated. `trades` is fully derived from these (rebuild.ts drops and
// re-derives per symbol), so re-importing an overlapping statement can't
// double-count: the dedupe hash is checked before insert, not after.
export const executions = pgTable(
  "executions",
  {
    id: id(),
    // sha256(date|time|symbol|side|qty|price) -- see import/dedupe.ts. Ref #
    // is deliberately excluded: it's not unique across a partial fill's
    // sibling executions (see CLAUDE.md).
    dedupeHash: text("dedupe_hash").notNull(),
    date: text("date").notNull(),
    time: text("time").notNull(),
    symbol: text("symbol").notNull(),
    side: text("side", { enum: ["buy", "sell"] }).notNull(),
    qty: qty("qty").notNull(),
    price: money("price").notNull(),
  },
  (t) => [unique("executions_dedupe_hash_unique").on(t.dedupeHash)],
);
