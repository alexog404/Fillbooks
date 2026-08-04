import { and, asc, eq, gte, lte } from "drizzle-orm";
import type { Db } from "@/db";
import * as schema from "@/db/schema";
import { AlpacaProvider } from "./alpaca";
import type { Bar, MarketDataProvider } from "./provider";

const TIMEFRAME = "1Min";
const SOURCE = "alpaca";

const defaultProvider = new AlpacaProvider();

function rowsToBars(rows: (typeof schema.priceBars.$inferSelect)[]): Bar[] {
  return rows.map((r) => ({ time: r.ts, open: r.o, high: r.h, low: r.l, close: r.c, volume: r.v ?? 0 }));
}

// A session cached while still in progress (or just closed) only has bars
// up to that moment -- trusting that partial cache as "the whole range" is
// what silently truncated charts for anything traded near a session's end.
// Only skip the provider once the session has been over long enough that a
// prior cache attempt, if any, would have captured the full day.
const SESSION_SETTLE_MS = 30 * 60 * 1000;

/**
 * Read-through cache over price_bars. A past session's bars never change,
 * so once a session is comfortably over, any cached row inside the range
 * is treated as proof the whole range was already fetched -- no per-bar
 * freshness check. A fetch that comes back empty (old trade beyond the
 * provider's history limit) is deliberately *not* cached as a "known
 * miss": at this data volume/audience of one, refetching on the next visit
 * is cheap and simpler than adding a fetch-attempted marker to the schema.
 */
export async function getBarsForSession(
  db: Db,
  symbol: string,
  sessionStartUtc: Date,
  sessionEndUtc: Date,
  provider: MarketDataProvider = defaultProvider,
): Promise<Bar[]> {
  const sessionSettled = Date.now() >= sessionEndUtc.getTime() + SESSION_SETTLE_MS;

  const cached = await db
    .select()
    .from(schema.priceBars)
    .where(
      and(
        eq(schema.priceBars.symbol, symbol),
        eq(schema.priceBars.timeframe, TIMEFRAME),
        gte(schema.priceBars.ts, sessionStartUtc),
        lte(schema.priceBars.ts, sessionEndUtc),
      ),
    )
    .orderBy(asc(schema.priceBars.ts));

  if (cached.length > 0 && sessionSettled) return rowsToBars(cached);

  const fetched = await provider.getBars(symbol, sessionStartUtc, sessionEndUtc);
  if (fetched.length === 0) return rowsToBars(cached);

  await db
    .insert(schema.priceBars)
    .values(
      fetched.map((b) => ({
        symbol,
        timeframe: TIMEFRAME,
        ts: b.time,
        o: b.open,
        h: b.high,
        l: b.low,
        c: b.close,
        v: b.volume,
        source: SOURCE,
      })),
    )
    .onConflictDoNothing();

  return fetched;
}
