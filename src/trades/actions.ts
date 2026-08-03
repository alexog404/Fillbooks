"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { getTradeById } from "./queries";
import { computeR } from "./journal";

export interface TradeJournalUpdate {
  mistakes?: string[];
  habits?: string[];
  rating?: number | null;
  notes?: string;
  target?: number | null;
  stop?: number | null;
}

/** Single entry point for every Trade Detail edit -- mistakes/habits chips,
 * star rating, notes, and target/stop all flow through here so `r` is
 * always recomputed consistently whenever target/stop change, rather than
 * each caller remembering to do it separately. */
export async function updateTradeJournal(tradeId: string, updates: TradeJournalUpdate): Promise<void> {
  const trade = await getTradeById(db, tradeId);
  if (!trade) throw new Error("Trade not found");

  const target = updates.target !== undefined ? updates.target : trade.target;
  const stop = updates.stop !== undefined ? updates.stop : trade.stop;
  const notes = updates.notes !== undefined ? updates.notes : trade.notes;

  await db
    .update(schema.trades)
    .set({
      ...updates,
      target,
      stop,
      r: computeR(trade.side, trade.entry, trade.exit, stop ?? null),
      hasNote: (notes ?? "").trim().length > 0,
    })
    .where(eq(schema.trades.id, tradeId));

  revalidatePath(`/trades/${tradeId}`);
  revalidatePath("/trades");
  revalidatePath("/");
  revalidatePath("/reports");
  revalidatePath("/journal");
}
