import { createHash } from "node:crypto";

/** sha256(date|time|symbol|side|qty|price|sourceRef). A shared *order* ref
 * number is deliberately excluded on its own -- it's not unique across a
 * partial fill's sibling executions -- but Schwab can report two genuinely
 * distinct fills at the exact same second, for the exact same qty and
 * price (observed live: two separate 100-share fills at the same
 * timestamp, same price, different Schwab activityIds). Without a per-fill
 * disambiguator those collide on (date, time, symbol, side, qty, price)
 * alone and the second one is silently dropped by the insert's
 * onConflictDoNothing -- real, silent execution loss, not a duplicate. See
 * CLAUDE.md's trap #4. `sourceRef` must be something unique to the specific
 * fill event (e.g. Schwab's transaction activityId), not a shared order
 * number. Shared by every source that inserts into `executions` (currently
 * just Schwab sync). */
export function computeExecutionDedupeHash(fields: {
  date: string;
  time: string;
  symbol: string;
  side: string;
  qty: number;
  price: number;
  sourceRef: string;
}): string {
  const key = [fields.date, fields.time, fields.symbol, fields.side, fields.qty, fields.price, fields.sourceRef].join("|");
  return createHash("sha256").update(key, "utf-8").digest("hex");
}
