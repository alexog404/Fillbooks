import { eq } from "drizzle-orm";
import type { Db } from "@/db";
import * as schema from "@/db/schema";

export async function getDailyNote(db: Db, date: string): Promise<string> {
  const rows = await db.select().from(schema.dailyNotes).where(eq(schema.dailyNotes.date, date)).limit(1);
  return rows[0]?.note ?? "";
}

/** Small, personal-scale dataset -- fetching every daily note up front
 * avoids a round trip on every date navigation client-side. */
export async function getAllDailyNotes(db: Db): Promise<Record<string, string>> {
  const rows = await db.select().from(schema.dailyNotes);
  return Object.fromEntries(rows.map((r) => [r.date, r.note]));
}
