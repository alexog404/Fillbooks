import type { Db } from "@/db";
import * as schema from "@/db/schema";
import type { Trade } from "@/lib/trades";

export async function getAllTrades(db: Db): Promise<Trade[]> {
  return db.select().from(schema.trades);
}
