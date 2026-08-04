import { createHash } from "node:crypto";

/** sha256(date|time|symbol|side|qty|price) -- Ref # is deliberately excluded:
 * it's not unique across a partial fill's sibling executions (a broker can
 * report multiple distinct fills at the exact same timestamp), so it can't
 * anchor identity. See CLAUDE.md. Shared by every source that inserts into
 * `executions` (currently just Schwab sync). */
export function computeExecutionDedupeHash(fields: {
  date: string;
  time: string;
  symbol: string;
  side: string;
  qty: number;
  price: number;
}): string {
  const key = [fields.date, fields.time, fields.symbol, fields.side, fields.qty, fields.price].join("|");
  return createHash("sha256").update(key, "utf-8").digest("hex");
}
