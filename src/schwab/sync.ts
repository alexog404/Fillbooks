"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { getSchwabConnection } from "./connectionQueries";
import { fetchAccountHash, fetchTransactions } from "./accounts";
import { mapSchwabTransactions } from "./syncMapper";
import { rebuildTradesForSymbols } from "@/trades/rebuild";

export interface SchwabSyncResult {
  success: boolean;
  message: string;
}

const DEFAULT_LOOKBACK_MS = 24 * 60 * 60 * 1000;

/**
 * Pulls new fills since the last successful sync (or the last 24h on a
 * connection that's never synced) and folds them into `executions` through
 * the same dedupe-hash/rebuild path the CSV importer uses -- so a Schwab
 * fill and a CSV-imported fill are indistinguishable once on record.
 *
 * `sinceOverride` exists only for the one-time full-history backfill run
 * right after deleting the old CSV-derived data; the button and the
 * periodic auto-sync both call this with no override and get the normal
 * incremental window.
 */
export async function syncSchwabAccount(sinceOverride?: Date): Promise<SchwabSyncResult> {
  const connection = await getSchwabConnection(db);
  if (!connection || connection.status !== "connected") {
    return { success: false, message: "Schwab is not connected." };
  }

  let accountHash: string;
  try {
    accountHash = await fetchAccountHash(db);
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Couldn't reach Schwab." };
  }

  const end = new Date();
  const start = sinceOverride ?? connection.lastSyncAt ?? new Date(end.getTime() - DEFAULT_LOOKBACK_MS);

  let transactions;
  try {
    transactions = await fetchTransactions(db, accountHash, start, end);
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Couldn't fetch transactions." };
  }

  const mapped = mapSchwabTransactions(transactions);

  let insertedCount = 0;
  let symbols = new Set<string>();
  if (mapped.length > 0) {
    const inserted = await db
      .insert(schema.executions)
      .values(mapped.map((e) => ({ dedupeHash: e.dedupeHash, date: e.date, time: e.time, symbol: e.symbol, side: e.side, qty: e.qty, price: e.price })))
      .onConflictDoNothing({ target: schema.executions.dedupeHash })
      .returning({ id: schema.executions.id });
    insertedCount = inserted.length;
    symbols = new Set(mapped.map((e) => e.symbol));
    await rebuildTradesForSymbols(db, symbols);
  }

  await db.update(schema.brokerConnections).set({ lastSyncAt: end }).where(eq(schema.brokerConnections.broker, "schwab"));

  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/trades");
  revalidatePath("/journal");
  revalidatePath("/reports");

  if (insertedCount === 0) {
    return { success: true, message: "No new fills." };
  }
  return { success: true, message: `Synced ${insertedCount} new fill${insertedCount === 1 ? "" : "s"} across ${symbols.size} symbol${symbols.size === 1 ? "" : "s"}.` };
}
