import { sanitizeRow, parseMoney } from "./sanitize";
import type { Section } from "./split";

export interface ParsedExecution {
  /** Statement-local timestamp, e.g. "7/27/26 18:44:18" -- not yet split
   * into date/time strings, see statementTime.ts. */
  execTimeRaw: string;
  side: "buy" | "sell";
  qty: number;
  symbol: string;
  instrumentType: "stock" | "option";
  price: number;
}

function buildColumnIndex(header: string[]): Map<string, number> {
  const index = new Map<string, number>();
  header.forEach((raw, i) => {
    const name = raw.trim().toLowerCase();
    if (name) index.set(name, i);
  });
  return index;
}

function requireColumn(index: Map<string, number>, name: string): number {
  const i = index.get(name.toLowerCase());
  if (i === undefined) {
    throw new Error(`Account Trade History: missing expected column "${name}"`);
  }
  return i;
}

/**
 * Parses the "Account Trade History" section into normalized executions --
 * the primary fill source. Fees live in a separate section (Cash Balance)
 * and aren't joined in yet (a follow-up refinement); every imported trade's
 * P&L is gross, not net of commissions, for now.
 */
export function parseTradeHistory(section: Section): ParsedExecution[] {
  const col = buildColumnIndex(section.header);
  const execTimeIdx = requireColumn(col, "Exec Time");
  const sideIdx = requireColumn(col, "Side");
  const qtyIdx = requireColumn(col, "Qty");
  const symbolIdx = requireColumn(col, "Symbol");
  const priceIdx = requireColumn(col, "Price");
  // Present on every known statement version but treated as optional so a
  // narrower export doesn't hard-fail the whole import.
  const expIdx = col.get("exp");
  const strikeIdx = col.get("strike");

  return section.rows.map((rawRow, i) => {
    const row = sanitizeRow(rawRow);

    const sideRaw = row[sideIdx]?.trim().toUpperCase();
    const side: ParsedExecution["side"] =
      sideRaw === "BUY" ? "buy" : sideRaw === "SELL" ? "sell" : (() => {
        throw new Error(`Account Trade History row ${i}: unrecognized Side "${row[sideIdx]}"`);
      })();

    const qty = parseMoney(row[qtyIdx]);
    if (qty === null) throw new Error(`Account Trade History row ${i}: unparseable Qty`);

    const price = parseMoney(row[priceIdx]);
    if (price === null) throw new Error(`Account Trade History row ${i}: unparseable Price`);

    const symbol = row[symbolIdx]?.trim();
    if (!symbol) throw new Error(`Account Trade History row ${i}: missing Symbol`);

    const hasOptionFields = Boolean(
      (expIdx !== undefined && row[expIdx]?.trim()) || (strikeIdx !== undefined && row[strikeIdx]?.trim()),
    );

    return {
      execTimeRaw: row[execTimeIdx]?.trim(),
      side,
      qty: Math.abs(qty),
      symbol,
      instrumentType: hasOptionFields ? "option" : "stock",
      price,
    };
  });
}
