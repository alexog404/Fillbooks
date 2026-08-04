"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { getTradeById } from "./queries";

export interface TradeJournalUpdate {
  mistakes?: string[];
  habits?: string[];
  rating?: number | null;
  notes?: string;
}

/** Single entry point for every Trade Detail edit -- mistakes/habits chips,
 * star rating, and notes all flow through here. */
export async function updateTradeJournal(tradeId: string, updates: TradeJournalUpdate): Promise<void> {
  const trade = await getTradeById(db, tradeId);
  if (!trade) throw new Error("Trade not found");

  const notes = updates.notes !== undefined ? updates.notes : trade.notes;

  await db
    .update(schema.trades)
    .set({
      ...updates,
      hasNote: (notes ?? "").trim().length > 0,
    })
    .where(eq(schema.trades.id, tradeId));

  revalidatePath(`/trades/${tradeId}`);
  revalidatePath("/trades");
  revalidatePath("/");
  revalidatePath("/reports");
  revalidatePath("/journal");
}
