"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { setStartingBalance } from "./queries";

export interface UpdateBalanceResult {
  success: boolean;
  message: string;
}

export async function updateStartingBalance(_prev: UpdateBalanceResult | null, formData: FormData): Promise<UpdateBalanceResult> {
  const raw = formData.get("startingBalance");
  const value = typeof raw === "string" ? Number(raw) : NaN;
  if (!Number.isFinite(value)) {
    return { success: false, message: "Enter a valid dollar amount." };
  }

  await setStartingBalance(db, value);
  revalidatePath("/");
  revalidatePath("/settings");

  return { success: true, message: "Starting balance updated." };
}
