import { eq, inArray } from "drizzle-orm";
import type { Db } from "@/db";
import * as schema from "@/db/schema";
import type { Trade } from "@/lib/trades";

export async function getAllTrades(db: Db): Promise<Trade[]> {
  return db.select().from(schema.trades);
}

export async function getTradeById(db: Db, id: string): Promise<Trade | null> {
  const rows = await db.select().from(schema.trades).where(eq(schema.trades.id, id)).limit(1);
  return rows[0] ?? null;
}

export interface TradeExecutionRow {
  time: string;
  price: number;
  qty: number;
  side: "buy" | "sell";
  role: "entry" | "exit";
}

/** The constituent fills that make up one trade, in chronological order --
 * for Trade Detail's Executions tab. */
export async function getTradeExecutions(db: Db, tradeId: string): Promise<TradeExecutionRow[]> {
  const links = await db.select().from(schema.tradeExecutions).where(eq(schema.tradeExecutions.tradeId, tradeId));
  if (links.length === 0) return [];
  const execIds = [...new Set(links.map((l) => l.executionId))];
  const execs = await db.select().from(schema.executions).where(inArray(schema.executions.id, execIds));
  const byId = new Map(execs.map((e) => [e.id, e]));
  return links
    .map((link) => {
      const exec = byId.get(link.executionId);
      if (!exec) return null;
      return { time: exec.time, price: link.price, qty: link.qtyApplied, side: exec.side, role: link.role };
    })
    .filter((r): r is TradeExecutionRow => r !== null)
    .sort((a, b) => a.time.localeCompare(b.time));
}
