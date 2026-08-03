"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { setSchwabConnectionStatus } from "./connectionQueries";

export async function disconnectSchwab(): Promise<void> {
  await setSchwabConnectionStatus(db, "disconnected");
  revalidatePath("/settings");
}
