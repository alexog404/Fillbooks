import { toZonedTime } from "date-fns-tz";
import { computeExecutionDedupeHash } from "@/import/dedupe";

const MARKET_ZONE = "America/New_York";

export interface SchwabTransferItem {
  instrument: { assetType: string; symbol: string };
  amount: number;
  price?: number;
}

export interface SchwabTransaction {
  activityId: number;
  time: string;
  type: string;
  transferItems: SchwabTransferItem[];
}

export interface MappedExecution {
  dedupeHash: string;
  date: string;
  time: string;
  symbol: string;
  side: "buy" | "sell";
  qty: number;
  price: number;
}

/** `time` is a real UTC instant (e.g. "2026-08-03T14:52:51+0000") --
 * `toZonedTime` shifts it so *local* getters read the ET wall-clock time,
 * per CLAUDE.md's timezone trap. Output stays plain ET strings, never
 * `timestamptz`, matching every other date/time column in this schema. */
function toEtDateTimeStrings(isoTime: string): { date: string; time: string } {
  const zoned = toZonedTime(new Date(isoTime), MARKET_ZONE);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${zoned.getFullYear()}-${pad(zoned.getMonth() + 1)}-${pad(zoned.getDate())}`,
    time: `${pad(zoned.getHours())}:${pad(zoned.getMinutes())}:${pad(zoned.getSeconds())}`,
  };
}

/**
 * Each Schwab "transaction" (one activityId) bundles the equity fill
 * together with its fee line items (commission, SEC fee, TAF, ...) in the
 * same `transferItems` array -- only the EQUITY item is a real fill.
 * `amount`'s sign is the side: positive = shares received (buy), negative
 * = shares given up (sell). Non-equity assetTypes (options, currency fee
 * lines) are skipped -- options aren't supported yet, matching the CSV
 * import path's same limitation.
 */
export function mapSchwabTransactions(transactions: SchwabTransaction[]): MappedExecution[] {
  const results: MappedExecution[] = [];
  for (const tx of transactions) {
    if (tx.type !== "TRADE") continue;
    for (const item of tx.transferItems) {
      if (item.instrument.assetType !== "EQUITY") continue;
      if (item.price == null || item.amount === 0) continue;

      const { date, time } = toEtDateTimeStrings(tx.time);
      const side: "buy" | "sell" = item.amount > 0 ? "buy" : "sell";
      const qty = Math.abs(item.amount);
      const symbol = item.instrument.symbol;
      const price = item.price;

      results.push({
        dedupeHash: computeExecutionDedupeHash({ date, time, symbol, side, qty, price }),
        date,
        time,
        symbol,
        side,
        qty,
        price,
      });
    }
  }
  return results;
}
