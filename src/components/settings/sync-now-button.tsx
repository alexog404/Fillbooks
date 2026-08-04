"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { syncSchwabAccount } from "@/schwab/sync";

export function SyncNowButton() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  function onClick() {
    startTransition(async () => {
      const result = await syncSchwabAccount();
      setMessage(result.message);
      if (result.success) router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        className="px-[18px] py-2.5 rounded-lg bg-surface-2 border border-border text-text-secondary text-[16px] font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "Syncing…" : "Sync now"}
      </button>
      {message && <div className="text-[13.5px] text-text-muted">{message}</div>}
    </div>
  );
}
