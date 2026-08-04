"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { syncSchwabAccount } from "@/schwab/sync";

const INTERVAL_MS = 60_000;

/** Silent background poll -- only runs at all while Schwab is connected.
 * Errors (a lapsed connection, a network blip) are swallowed here on
 * purpose: this is a best-effort freshness nudge, not a user-facing
 * action, so it must never surface a toast/alert on its own. The Settings
 * page's connection card is what actually tells the user if the
 * connection needs attention. */
export function SchwabAutoSync({ connected }: { connected: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!connected) return;

    let cancelled = false;
    const id = setInterval(() => {
      syncSchwabAccount()
        .then((result) => {
          if (!cancelled && result.success) router.refresh();
        })
        .catch(() => {});
    }, INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [connected, router]);

  return null;
}
