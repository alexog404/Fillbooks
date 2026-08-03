import type { BrokerConnection } from "@/schwab/connectionQueries";
import type { BrokerDisplayState } from "@/schwab/connectionDisplay";
import { disconnectSchwab } from "@/schwab/actions";

function fmtEt(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit",
  }) + " ET";
}

const BADGE: Record<BrokerDisplayState, { text: string; color: string; bg: string }> = {
  disconnected: { text: "NOT CONNECTED", color: "var(--text-muted)", bg: "var(--surface-2)" },
  connected: { text: "CONNECTED", color: "var(--win)", bg: "var(--win-soft)" },
  expired: { text: "EXPIRED", color: "var(--loss)", bg: "var(--loss-soft)" },
};

const MESSAGE: Record<BrokerDisplayState, string> = {
  disconnected: "Connect your Schwab account to sync real trades automatically.",
  connected: "Schwab refresh tokens last exactly 7 days and can't be renewed automatically -- you'll need to reconnect before this one expires.",
  expired: "This connection's 7-day refresh window has elapsed. Reconnect to resume syncing.",
};

export function BrokerConnectionCard({ connection, state }: { connection: BrokerConnection | null; state: BrokerDisplayState }) {
  const badge = BADGE[state];
  const cardBorder = state === "expired" ? "var(--loss)" : "var(--border)";
  const cardBg = state === "expired" ? "color-mix(in srgb, var(--loss) 6%, transparent)" : "var(--surface)";

  return (
    <div className="rounded-xl px-[22px] py-5 mb-4 border" style={{ borderColor: cardBorder, background: cardBg }}>
      <div className="flex items-center gap-2.5 mb-2.5">
        <span className="text-[10.5px] font-extrabold tracking-[0.04em] px-2.5 py-1 rounded-md" style={{ color: badge.color, background: badge.bg }}>
          {badge.text}
        </span>
        <div className="text-[19px] font-bold">Schwab connection</div>
      </div>
      <div className="text-[12.5px] text-text-secondary leading-[1.55] max-w-[640px] mb-4">{MESSAGE[state]}</div>

      {connection && (
        <div className="flex gap-10 flex-wrap mb-[18px]">
          <div>
            <div className="text-[10px] text-text-muted uppercase tracking-[0.04em] mb-1">
              {state === "expired" ? "Expired" : "Expires"}
            </div>
            <div className="text-[12.5px] font-mono">{fmtEt(connection.tokenExpiresAt)}</div>
          </div>
          <div>
            <div className="text-[10px] text-text-muted uppercase tracking-[0.04em] mb-1">Last Synced</div>
            <div className="text-[12.5px] font-mono">{fmtEt(connection.lastSyncAt)}</div>
          </div>
        </div>
      )}

      <div className="flex gap-2.5">
        {(state === "disconnected" || state === "expired") && (
          <a
            href="/api/schwab/authorize"
            className="px-[18px] py-2.5 rounded-lg bg-primary text-white text-[13px] font-bold cursor-pointer"
          >
            {state === "expired" ? "Re-authorize" : "Connect"}
          </a>
        )}
        {state === "connected" && (
          <>
            <button
              type="button"
              disabled
              title="Sync logic isn't built yet -- coming in a future feature"
              className="px-[18px] py-2.5 rounded-lg bg-surface-2 border border-border text-text-muted text-[13px] font-semibold cursor-not-allowed opacity-60"
            >
              Sync now
            </button>
            <form action={disconnectSchwab}>
              <button type="submit" className="px-[18px] py-2.5 rounded-lg bg-transparent border border-border text-text-muted text-[13px] font-semibold cursor-pointer">
                Disconnect
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
