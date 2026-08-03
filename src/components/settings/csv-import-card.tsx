"use client";

import { useActionState } from "react";
import { importCsv, type ImportResult } from "@/import/actions";

const initialState: ImportResult | null = null;

export function CsvImportCard() {
  const [result, formAction, isPending] = useActionState(importCsv, initialState);

  return (
    <div className="bg-surface border border-border rounded-[10px] px-5 py-[18px] mb-4">
      <div className="text-[15px] font-bold mb-2.5">Import trades</div>
      <div className="text-[12.5px] text-text-muted mb-3.5">
        Upload a thinkorswim/Schwab statement export (CSV) to backfill trade history.
      </div>
      <form action={formAction} className="flex items-center gap-3 flex-wrap">
        <label className="px-[18px] py-2.5 rounded-lg bg-primary text-white text-[13px] font-bold cursor-pointer">
          {isPending ? "Importing…" : "Choose CSV file"}
          <input type="file" name="file" accept=".csv" disabled={isPending} className="hidden" onChange={(e) => e.currentTarget.form?.requestSubmit()} />
        </label>
        {result && (
          <div className="text-[12.5px]" style={{ color: result.success ? "var(--win)" : "var(--loss)" }}>
            {result.success ? "✓ " : ""}
            {result.message}
          </div>
        )}
      </form>
    </div>
  );
}
