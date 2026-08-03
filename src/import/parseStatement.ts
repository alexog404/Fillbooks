import { parseStatementHeader } from "./statementHeader";
import { splitSections, getSection } from "./split";
import { parseTradeHistory } from "./tradeHistory";
import { parseStatementLocalTime, formatDateTimeStrings } from "./statementTime";
import { computeExecutionDedupeHash } from "./dedupe";

export interface ParsedStatementExecution {
  dedupeHash: string;
  date: string;
  time: string;
  symbol: string;
  side: "buy" | "sell";
  qty: number;
  price: number;
}

export interface ParsedStatement {
  accountMask: string | null;
  executions: ParsedStatementExecution[];
  /** Option rows in Account Trade History, skipped for now -- this app only
   * handles stock trades so far. Reported so the import result can tell the
   * user something was intentionally left out, not silently dropped. */
  skippedOptionCount: number;
}

/**
 * Parses a full thinkorswim/Schwab statement export into deduped, stock-only
 * executions ready for FIFO rebuild. Fees aren't joined in yet (Cash Balance
 * section) and every row is assumed to already be in Eastern time -- both
 * are known, flagged simplifications, not oversights.
 */
export function parseStatement(text: string): ParsedStatement {
  const header = parseStatementHeader(text);
  const sections = splitSections(text);
  const tradeHistorySection = getSection(sections, "Account Trade History");
  if (!tradeHistorySection) {
    throw new Error('No "Account Trade History" section found -- is this a thinkorswim/Schwab statement export?');
  }

  const parsed = parseTradeHistory(tradeHistorySection);

  let skippedOptionCount = 0;
  const executions: ParsedStatementExecution[] = [];
  for (const p of parsed) {
    if (p.instrumentType === "option") {
      skippedOptionCount++;
      continue;
    }
    const local = parseStatementLocalTime(p.execTimeRaw);
    if (!local) throw new Error(`Unrecognized Exec Time format: "${p.execTimeRaw}"`);
    const { date, time } = formatDateTimeStrings(local);
    const dedupeHash = computeExecutionDedupeHash({ date, time, symbol: p.symbol, side: p.side, qty: p.qty, price: p.price });
    executions.push({ dedupeHash, date, time, symbol: p.symbol, side: p.side, qty: p.qty, price: p.price });
  }

  return { accountMask: header?.accountMask ?? null, executions, skippedOptionCount };
}
