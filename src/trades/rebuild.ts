import { createHash } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import type { Db } from "@/db";
import * as schema from "@/db/schema";
import { matchFifoTrades, type FifoExecutionInput } from "./fifo";

type ExecutionRow = typeof schema.executions.$inferSelect;

function toDate(date: string, time: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [h, mi, s] = time.split(":").map(Number);
  return new Date(y, m - 1, d, h, mi, s);
}

/**
 * A trade's id is derived from what makes it *this* logical trade, not a
 * random UUID -- rebuild runs on every import, and re-deriving the same
 * underlying executions must produce the same id so future journal data
 * (notes, tags) keyed to it survives a rebuild.
 *
 * `entryExecutionId` (the execution that opened this specific lot) is part
 * of the key, not just (symbol, direction, openedAt) -- a multi-fill order
 * can have several partial-fill executions land at the exact same
 * timestamp (a broker reporting a single order's fills as separate rows,
 * all stamped the same second). Each partial fill opens its own FIFO lot/
 * trade (one closed lot = one trade), but without this they'd all hash to
 * the same id and silently overwrite each other on upsert. See CLAUDE.md.
 */
function computeTradeId(symbol: string, direction: string, entryDate: string, entryTime: string, entryExecutionId: string): string {
  return createHash("sha256").update([symbol, direction, entryDate, entryTime, entryExecutionId].join("|")).digest("hex");
}

/**
 * Recomputes trades for one symbol from every execution on record -- trades
 * are derived data, dropped and rebuilt rather than incrementally patched.
 * Existing rows whose id still matches (same logical trade) are updated in
 * place via upsert rather than deleted -- that's what makes the stable id
 * above pay off: journal-ish fields (mistakes, habits, rating, target, stop,
 * mae, mfe, hasNote) are deliberately left out of the update `set`, so
 * re-running this doesn't erase anything a user entered by hand later.
 */
export async function rebuildTradesForSymbol(db: Db, symbol: string): Promise<void> {
  const execRows = await db.select().from(schema.executions).where(eq(schema.executions.symbol, symbol));

  const sorted = [...execRows].sort((a: ExecutionRow, b: ExecutionRow) => {
    const ak = a.date + "T" + a.time;
    const bk = b.date + "T" + b.time;
    if (ak !== bk) return ak < bk ? -1 : 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  const byId = new Map(sorted.map((e) => [e.id, e]));

  const fifoInputs: FifoExecutionInput[] = sorted.map((e) => ({
    id: e.id,
    executedAt: toDate(e.date, e.time),
    side: e.side,
    qty: e.qty,
    price: e.price,
    fees: 0,
  }));

  const fifoTrades = matchFifoTrades(fifoInputs);

  const newRows = fifoTrades.map((trade) => {
    const entryLink = trade.links[0];
    const entryExec = byId.get(entryLink.executionId)!;
    return {
      id: computeTradeId(symbol, trade.direction, entryExec.date, entryExec.time, entryLink.executionId),
      date: entryExec.date,
      time: entryExec.time,
      symbol,
      side: trade.direction,
      qty: trade.qty,
      entry: trade.avgEntry,
      exit: trade.avgExit ?? trade.avgEntry,
      pnl: trade.netPnl ?? 0,
      durationSeconds: trade.closedAt ? Math.round((trade.closedAt.getTime() - trade.openedAt.getTime()) / 1000) : null,
      status: (trade.status === "closed" ? "closed" : "working") as "closed" | "working",
      links: trade.links,
    };
  });
  const newIds = newRows.map((r) => r.id);

  await db.transaction(async (tx) => {
    const existing = await tx.select({ id: schema.trades.id }).from(schema.trades).where(eq(schema.trades.symbol, symbol));
    const staleIds = existing.map((r) => r.id).filter((id) => !newIds.includes(id));
    if (staleIds.length > 0) {
      await tx.delete(schema.tradeExecutions).where(inArray(schema.tradeExecutions.tradeId, staleIds));
      await tx.delete(schema.trades).where(inArray(schema.trades.id, staleIds));
    }

    for (const row of newRows) {
      await tx
        .insert(schema.trades)
        .values(row)
        .onConflictDoUpdate({
          target: schema.trades.id,
          set: {
            date: row.date,
            time: row.time,
            qty: row.qty,
            entry: row.entry,
            exit: row.exit,
            pnl: row.pnl,
            durationSeconds: row.durationSeconds,
            status: row.status,
          },
        });

      // Links are cheap to fully replace rather than diff -- always the
      // same shape derived fresh from this rebuild's FIFO match.
      await tx.delete(schema.tradeExecutions).where(eq(schema.tradeExecutions.tradeId, row.id));
      if (row.links.length > 0) {
        await tx.insert(schema.tradeExecutions).values(
          row.links.map((link) => ({
            tradeId: row.id,
            executionId: link.executionId,
            role: link.role,
            qtyApplied: link.qtyApplied,
            price: link.price,
          })),
        );
      }
    }
  });
}

export async function rebuildTradesForSymbols(db: Db, symbols: Iterable<string>): Promise<void> {
  for (const symbol of new Set(symbols)) {
    await rebuildTradesForSymbol(db, symbol);
  }
}
