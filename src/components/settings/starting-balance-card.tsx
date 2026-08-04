"use client";

import { useActionState } from "react";
import { updateStartingBalance, type UpdateBalanceResult } from "@/settings/actions";

const initialState: UpdateBalanceResult | null = null;

export function StartingBalanceCard({ startingBalance }: { startingBalance: number | null }) {
  const [result, formAction, isPending] = useActionState(updateStartingBalance, initialState);

  return (
    <div className="bg-surface border border-border rounded-[10px] px-5 py-[18px] mb-4">
      <div className="text-[18px] font-bold mb-2.5">Starting balance</div>
      <div className="text-[15.5px] text-text-muted mb-3.5">
        {startingBalance === null
          ? "Not set yet -- enter your account balance directly."
          : "Deposits, withdrawals, and untracked fees mean this can drift from your broker's real balance -- adjust it if it looks off."}
      </div>
      <form action={formAction} className="flex items-center gap-3 flex-wrap">
        <input
          type="number"
          step="0.01"
          name="startingBalance"
          defaultValue={startingBalance ?? undefined}
          placeholder="10000.00"
          disabled={isPending}
          className="text-[16px] px-3 py-2 rounded-lg bg-surface-2 border border-border w-[160px]"
        />
        <button type="submit" disabled={isPending} className="px-[18px] py-2 rounded-lg bg-primary text-white text-[16px] font-bold cursor-pointer">
          {isPending ? "Saving…" : "Save"}
        </button>
        {result && (
          <div className="text-[15.5px]" style={{ color: result.success ? "var(--win)" : "var(--loss)" }}>
            {result.success ? "✓ " : ""}
            {result.message}
          </div>
        )}
      </form>
    </div>
  );
}
