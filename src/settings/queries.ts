import { eq } from "drizzle-orm";
import type { Db } from "@/db";
import * as schema from "@/db/schema";

const ROW_ID = "default";

export async function getStartingBalance(db: Db): Promise<number | null> {
  const rows = await db.select().from(schema.appSettings).where(eq(schema.appSettings.id, ROW_ID)).limit(1);
  return rows[0]?.startingBalance ?? null;
}

export async function setStartingBalance(db: Db, value: number): Promise<void> {
  await db
    .insert(schema.appSettings)
    .values({ id: ROW_ID, startingBalance: value })
    .onConflictDoUpdate({ target: schema.appSettings.id, set: { startingBalance: value } });
}

/** Only sets the value if unset -- used right after an import so a second,
 * later import doesn't clobber a balance the user may have since edited. */
export async function setStartingBalanceIfUnset(db: Db, value: number): Promise<void> {
  const existing = await getStartingBalance(db);
  if (existing === null) {
    await setStartingBalance(db, value);
  }
}
