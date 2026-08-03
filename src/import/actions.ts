"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { parseStatement } from "./parseStatement";
import { rebuildTradesForSymbols } from "@/trades/rebuild";
import { setStartingBalanceIfUnset } from "@/settings/queries";

export interface ImportResult {
  success: boolean;
  message: string;
}

export async function importCsv(_prevState: ImportResult | null, formData: FormData): Promise<ImportResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, message: "Choose a CSV file first." };
  }

  let text: string;
  try {
    text = await file.text();
  } catch {
    return { success: false, message: "Couldn't read that file." };
  }

  let parsed;
  try {
    parsed = parseStatement(text);
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Couldn't parse that statement." };
  }

  if (parsed.executions.length === 0) {
    return { success: false, message: "No stock executions found in that statement." };
  }

  // Insert only genuinely new fills -- `onConflictDoNothing` against the
  // unique dedupe hash means re-importing an overlapping statement is a
  // safe no-op for anything already on record, not a duplicate.
  const inserted = await db
    .insert(schema.executions)
    .values(parsed.executions.map((e) => ({ dedupeHash: e.dedupeHash, date: e.date, time: e.time, symbol: e.symbol, side: e.side, qty: e.qty, price: e.price })))
    .onConflictDoNothing({ target: schema.executions.dedupeHash })
    .returning({ id: schema.executions.id });

  const symbols = new Set(parsed.executions.map((e) => e.symbol));
  await rebuildTradesForSymbols(db, symbols);

  // Derives a real starting balance from the statement's own ending balance
  // instead of a placeholder -- only on first import (never overwrites a
  // value the user has since edited or a later import already found).
  if (parsed.netLiquidatingValue !== null) {
    const allTrades = await db.select({ pnl: schema.trades.pnl }).from(schema.trades);
    const totalRealizedPnl = allTrades.reduce((s, t) => s + t.pnl, 0);
    await setStartingBalanceIfUnset(db, parsed.netLiquidatingValue - totalRealizedPnl);
  }

  revalidatePath("/");
  revalidatePath("/settings");

  const skippedNote = parsed.skippedOptionCount > 0 ? ` (${parsed.skippedOptionCount} option row${parsed.skippedOptionCount === 1 ? "" : "s"} skipped -- not supported yet)` : "";
  const dupeCount = parsed.executions.length - inserted.length;
  const dupeNote = dupeCount > 0 ? `, ${dupeCount} already on record` : "";

  return {
    success: true,
    message: `Imported ${inserted.length} new fill${inserted.length === 1 ? "" : "s"} across ${symbols.size} symbol${symbols.size === 1 ? "" : "s"}${dupeNote}${skippedNote}.`,
  };
}
