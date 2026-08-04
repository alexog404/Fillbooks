import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

// Hard safety guard -- this script TRUNCATEs and reseeds `trades`, and must
// never be pointable at fillbooks-prod. The ref is the project id in the
// pooler hostname (postgres.<ref>@aws-...), not a secret.
const PROD_PROJECT_REF = "kgfkbwkifeciphufexmy";

function durationToSeconds(dur: string): number | null {
  if (!dur || dur === "—") return null;
  const m = parseInt((dur.match(/(\d+)m/) || [0, "0"])[1] as string, 10);
  const s = parseInt((dur.match(/(\d+)s/) || [0, "0"])[1] as string, 10);
  return m * 60 + s;
}

// Same sample set as the approved mockup's trade-data.js -- realistic
// symbols/prices/durations, spanning enough weeks/days to exercise the
// calendar, KPI, and equity-chart math meaningfully.
const FIXTURE_TRADES = [
  { date: "2026-07-06", time: "09:31:12", symbol: "SOFI", side: "long" as const, qty: 800, entry: 8.42, exit: 8.71, pnl: 232.0, setup: "gap-and-go", duration: "4m 12s", status: "closed" as const, hasNote: true, mistakes: ["chased"], habits: ["followed plan"], rating: 4, mae: -0.06, mfe: 0.34 },
  { date: "2026-07-06", time: "09:38:44", symbol: "ATER", side: "long" as const, qty: 1200, entry: 2.14, exit: 2.05, pnl: -108.0, setup: "micro-pullback", duration: "2m 03s", status: "closed" as const, hasNote: true, mistakes: ["early entry"], habits: [], rating: 2, mae: -0.09, mfe: 0.02 },
  { date: "2026-07-06", time: "10:02:31", symbol: "PHUN", side: "long" as const, qty: 2000, entry: 1.31, exit: 1.42, pnl: 220.0, setup: "bull-flag", duration: "6m 41s", status: "closed" as const, hasNote: false, mistakes: [], habits: ["sized correctly"], rating: 5, mae: -0.02, mfe: 0.13 },
  { date: "2026-07-07", time: "09:33:02", symbol: "MULN", side: "long" as const, qty: 3000, entry: 0.62, exit: 0.58, pnl: -120.0, setup: "flat-top-breakout", duration: "1m 55s", status: "closed" as const, hasNote: true, mistakes: ["no catalyst", "oversized"], habits: [], rating: 1, mae: -0.05, mfe: 0.01 },
  { date: "2026-07-07", time: "09:47:19", symbol: "BBIG", side: "short" as const, qty: 1500, entry: 3.05, exit: 2.88, pnl: 255.0, setup: "first-pullback", duration: "5m 08s", status: "closed" as const, hasNote: true, mistakes: [], habits: ["waited for confirmation"], rating: 4, mae: -0.04, mfe: 0.21 },
  { date: "2026-07-08", time: "09:31:47", symbol: "SOFI", side: "long" as const, qty: 1000, entry: 8.05, exit: 8.05, pnl: 0.0, setup: "gap-and-go", duration: "0m 48s", status: "closed" as const, hasNote: false, mistakes: ["no catalyst"], habits: [], rating: 3, mae: -0.03, mfe: 0.03 },
  { date: "2026-07-09", time: "09:35:55", symbol: "CTRM", side: "long" as const, qty: 5000, entry: 0.41, exit: 0.36, pnl: -250.0, setup: "micro-pullback", duration: "3m 20s", status: "closed" as const, hasNote: true, mistakes: ["held through stop", "late entry"], habits: [], rating: 1, mae: -0.06, mfe: 0.01 },
  { date: "2026-07-09", time: "10:12:08", symbol: "TELL", side: "long" as const, qty: 900, entry: 1.98, exit: 2.21, pnl: 207.0, setup: "bull-flag", duration: "7m 14s", status: "closed" as const, hasNote: true, mistakes: [], habits: ["followed plan", "sized correctly"], rating: 5, mae: -0.02, mfe: 0.24 },
  { date: "2026-07-10", time: "09:41:29", symbol: "XELA", side: "long" as const, qty: 4000, entry: 0.29, exit: 0.31, pnl: 80.0, setup: "flat-top-breakout", duration: "2m 39s", status: "closed" as const, hasNote: false, mistakes: [], habits: [], rating: 3, mae: -0.01, mfe: 0.03 },
  { date: "2026-07-10", time: "10:05:14", symbol: "GNUS", side: "short" as const, qty: 1800, entry: 1.55, exit: 1.62, pnl: -126.0, setup: "first-pullback", duration: "3m 47s", status: "closed" as const, hasNote: true, mistakes: ["chased", "early entry"], habits: [], rating: 2, mae: -0.07, mfe: 0.0 },
  { date: "2026-07-13", time: "09:32:51", symbol: "SNDL", side: "long" as const, qty: 2500, entry: 2.02, exit: 2.19, pnl: 425.0, setup: "gap-and-go", duration: "5m 33s", status: "closed" as const, hasNote: true, mistakes: [], habits: ["followed plan"], rating: 5, mae: -0.03, mfe: 0.19 },
  { date: "2026-07-13", time: "10:22:03", symbol: "ATER", side: "long" as const, qty: 1000, entry: 2.31, exit: 2.24, pnl: -70.0, setup: "micro-pullback", duration: "1m 41s", status: "closed" as const, hasNote: false, mistakes: ["late entry"], habits: [], rating: 2, mae: -0.08, mfe: 0.01 },
  { date: "2026-07-14", time: "09:36:40", symbol: "PHUN", side: "long" as const, qty: 1600, entry: 1.19, exit: 1.19, pnl: -12.0, setup: "no-setup", duration: "0m 55s", status: "closed" as const, hasNote: true, mistakes: ["no catalyst", "oversized"], habits: [], rating: 1, mae: -0.05, mfe: 0.02 },
  { date: "2026-07-14", time: "09:52:17", symbol: "MULN", side: "long" as const, qty: 2800, entry: 0.58, exit: 0.66, pnl: 224.0, setup: "bull-flag", duration: "6m 02s", status: "closed" as const, hasNote: true, mistakes: [], habits: ["sized correctly", "waited for confirmation"], rating: 4, mae: -0.02, mfe: 0.11 },
  { date: "2026-07-15", time: "09:34:22", symbol: "BBIG", side: "short" as const, qty: 1300, entry: 2.74, exit: 2.61, pnl: 169.0, setup: "first-pullback", duration: "4m 29s", status: "closed" as const, hasNote: false, mistakes: [], habits: [], rating: 4, mae: -0.03, mfe: 0.15 },
  { date: "2026-07-16", time: "09:30:58", symbol: "SOFI", side: "long" as const, qty: 1400, entry: 8.61, exit: 8.94, pnl: 462.0, setup: "gap-and-go", duration: "8m 51s", status: "closed" as const, hasNote: true, mistakes: [], habits: ["followed plan", "sized correctly"], rating: 5, mae: -0.04, mfe: 0.35 },
  { date: "2026-07-16", time: "10:41:03", symbol: "CTRM", side: "long" as const, qty: 6000, entry: 0.38, exit: 0.35, pnl: -180.0, setup: "micro-pullback", duration: "2m 15s", status: "closed" as const, hasNote: true, mistakes: ["chased"], habits: [], rating: 2, mae: -0.05, mfe: 0.01 },
  { date: "2026-07-17", time: "09:33:37", symbol: "TELL", side: "long" as const, qty: 700, entry: 2.05, exit: 1.97, pnl: -56.0, setup: "flat-top-breakout", duration: "1m 28s", status: "closed" as const, hasNote: false, mistakes: ["early entry"], habits: [], rating: 2, mae: -0.09, mfe: 0.0 },
  { date: "2026-07-17", time: "10:09:51", symbol: "GNUS", side: "long" as const, qty: 3200, entry: 1.11, exit: 1.24, pnl: 416.0, setup: "bull-flag", duration: "6m 47s", status: "closed" as const, hasNote: true, mistakes: [], habits: ["followed plan"], rating: 5, mae: -0.03, mfe: 0.15 },
  { date: "2026-07-20", time: "09:31:19", symbol: "SNDL", side: "long" as const, qty: 2200, entry: 1.94, exit: 1.88, pnl: -132.0, setup: "first-pullback", duration: "2m 51s", status: "closed" as const, hasNote: true, mistakes: ["held through stop"], habits: [], rating: 1, mae: -0.06, mfe: 0.02 },
  { date: "2026-07-21", time: "09:32:10", symbol: "RIOT", side: "long" as const, qty: 1500, entry: 9.42, exit: 9.42, pnl: 0.0, setup: "gap-and-go", duration: "—", status: "working" as const, hasNote: false, mistakes: [], habits: [], rating: 0, mae: 0, mfe: 0 },
  { date: "2026-07-22", time: "09:34:55", symbol: "MARA", side: "short" as const, qty: 1100, entry: 14.28, exit: 14.28, pnl: 0.0, setup: "first-pullback", duration: "—", status: "working" as const, hasNote: false, mistakes: [], habits: [], rating: 0, mae: 0, mfe: 0 },
  { date: "2026-07-23", time: "09:31:40", symbol: "AMC", side: "long" as const, qty: 3400, entry: 3.02, exit: 3.02, pnl: 0.0, setup: "micro-pullback", duration: "—", status: "cancelled" as const, hasNote: false, mistakes: ["no fill"], habits: [], rating: 0, mae: 0, mfe: 0 },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  if (url.includes(PROD_PROJECT_REF)) {
    throw new Error(
      "Refusing to seed: DATABASE_URL points at fillbooks-prod. This script is for fillbooks-dev only.",
    );
  }

  const client = postgres(url, { max: 1, prepare: false });
  const db = drizzle(client, { schema });

  await db.delete(schema.trades);
  await db.insert(schema.trades).values(
    FIXTURE_TRADES.map((t) => ({
      date: t.date,
      time: t.time,
      symbol: t.symbol,
      side: t.side,
      qty: t.qty,
      entry: t.entry,
      exit: t.exit,
      pnl: t.pnl,
      setup: t.setup,
      durationSeconds: durationToSeconds(t.duration),
      status: t.status,
      hasNote: t.hasNote,
      mistakes: t.mistakes,
      habits: t.habits,
      rating: t.rating,
      mae: t.mae,
      mfe: t.mfe,
    })),
  );

  console.log(`Seeded ${FIXTURE_TRADES.length} fixture trades into fillbooks-dev.`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
