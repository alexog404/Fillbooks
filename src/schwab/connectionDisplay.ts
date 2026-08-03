import type { BrokerConnection } from "./connectionQueries";

export type BrokerDisplayState = "disconnected" | "connected" | "expired";

/** Derived from `tokenExpiresAt` directly, not `status` alone -- nothing
 * flips `status` to "expired" on its own (there's no cron yet), so a
 * connection whose 7-day window has silently elapsed must still be
 * detected here rather than trusting a possibly-stale stored status. */
export function getBrokerConnectionDisplayState(connection: BrokerConnection | null): BrokerDisplayState {
  if (!connection || connection.status === "disconnected") return "disconnected";
  if (connection.tokenExpiresAt && connection.tokenExpiresAt.getTime() <= Date.now()) return "expired";
  return "connected";
}
