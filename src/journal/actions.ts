"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import * as schema from "@/db/schema";

export async function updateDailyNote(date: string, note: string): Promise<void> {
  await db
    .insert(schema.dailyNotes)
    .values({ date, note })
    .onConflictDoUpdate({ target: schema.dailyNotes.date, set: { note } });
  revalidatePath("/journal");
}
