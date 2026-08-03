import Link from "next/link";
import { dateShort, money, pnlColorVar, type Trade } from "@/lib/trades";

export function RecentTrades({ trades }: { trades: Trade[] }) {
  const recent = [...trades]
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
    .slice(0, 8);

  const cols = "grid-cols-[20fr_42fr_18fr_43fr_24fr_53fr]";

  return (
    <div className="bg-surface border border-border rounded-[10px] min-w-0">
      <div className="px-[18px] py-3.5 border-b border-border text-[16px] font-bold">Recent Trades</div>
      <div className={`grid ${cols} gap-1 px-[9px] py-2 text-[9px] text-text-muted uppercase tracking-[0.02em]`}>
        <div>Date</div><div>Sym</div><div className="text-right">Qty</div><div className="text-right">P&L</div><div className="text-right">R</div><div>Status</div>
      </div>
      {recent.length === 0 && <div className="px-[18px] py-6 text-sm text-text-muted">No trades yet.</div>}
      {recent.map((t) => {
        const statusText = t.status === "cancelled" ? "Cancelled" : t.status === "closed" ? "Filled" : "Working";
        const statusDot = t.status === "cancelled" ? "var(--loss)" : t.status === "closed" ? "var(--win)" : "#f59e0b";
        return (
          <Link
            key={t.id}
            href={`/trades/${t.id}?from=dashboard`}
            className={`grid ${cols} gap-1 px-[9px] py-2 text-[10.5px] border-t border-border items-center hover:bg-surface-hover`}
          >
            <div className="text-text-secondary text-[8.5px]">{dateShort(t.date)}</div>
            <div className="font-bold font-mono overflow-hidden text-ellipsis whitespace-nowrap text-[10px]">{t.symbol}</div>
            <div className="text-right font-mono text-[9px] text-text-secondary whitespace-nowrap">{t.qty}</div>
            <div className="text-right font-bold font-mono text-[9.5px] whitespace-nowrap" style={{ color: pnlColorVar(t.pnl) }}>{money(t.pnl, true)}</div>
            <div className="text-right font-mono text-[9px] whitespace-nowrap" style={{ color: pnlColorVar(t.r ?? 0) }}>{(t.r ?? 0).toFixed(1)}R</div>
            <div className="flex items-center justify-end gap-1 min-w-0 overflow-hidden">
              <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: statusDot }} />
              <span className="text-[8px] font-medium text-text-muted whitespace-nowrap overflow-hidden text-ellipsis">{statusText}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
