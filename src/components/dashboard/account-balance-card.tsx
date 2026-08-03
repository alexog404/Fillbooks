"use client";

import { useState } from "react";
import { dateShort, type Trade } from "@/lib/trades";

export function AccountBalanceCard({
  trades,
  startingBalance,
  weekStartBalance,
  weekPnlSum,
}: {
  trades: Trade[];
  startingBalance: number;
  weekStartBalance: number;
  weekPnlSum: number;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const sorted = [...trades].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  let cum = startingBalance;
  const series = [startingBalance, ...sorted.map((t) => (cum += t.pnl))];
  const dates: (string | null)[] = [sorted[0] ? sorted[0].date : null, ...sorted.map((t) => t.date)];

  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const W = 90, H = 34;
  const stepX = W / Math.max(series.length - 1, 1);
  const toY = (v: number) => H - ((v - min) / range) * (H - 4) - 2;
  const points = series.map((v, i) => `${(i * stepX).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");
  const area = `0,${H} ${points} ${W},${H}`;

  const balance = series[series.length - 1];
  const hovering = hoverIdx != null && hoverIdx >= 0 && hoverIdx < series.length;
  const hoverX = hovering ? hoverIdx! * stepX : null;
  const hoverY = hovering ? toY(series[hoverIdx!]) : null;

  const weekPct = weekStartBalance ? (weekPnlSum / weekStartBalance) * 100 : 0;
  const weekPctText = (weekPct >= 0 ? "+" : "") + weekPct.toFixed(2) + "%";
  const weekPctColor = weekPct >= 0 ? "var(--win)" : "var(--loss)";

  const hoverPct = hovering && weekStartBalance ? ((series[hoverIdx!] - weekStartBalance) / weekStartBalance) * 100 : null;
  const hoverPctText = hoverPct != null ? (hoverPct >= 0 ? "+" : "") + hoverPct.toFixed(2) + "%" : null;
  const hoverPctColor = hoverPct != null ? (hoverPct >= 0 ? "var(--win)" : "var(--loss)") : null;

  const displayText = hovering
    ? "$" + series[hoverIdx!].toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    : "$" + balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const displaySub = hovering ? hoverPctText : weekPctText;
  const displaySubColor = hovering ? hoverPctColor! : weekPctColor;

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const idx = Math.round(frac * (series.length - 1));
    if (idx !== hoverIdx) setHoverIdx(idx);
  }

  return (
    <div
      onMouseMove={onMouseMove}
      onMouseLeave={() => setHoverIdx(null)}
      className="flex-none w-[350px] rounded-xl px-5 py-4 flex flex-col justify-between relative overflow-hidden bg-background"
    >
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0">
        <defs>
          <linearGradient id="acctSparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--win)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="var(--win)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline points={area} fill="url(#acctSparkGrad)" stroke="none" />
        <polyline points={points} fill="none" stroke="var(--win)" strokeWidth="1" strokeLinejoin="round" strokeLinecap="round" strokeOpacity="0.9" />
        {hovering && (
          <>
            <line
              x1="0" y1="0" x2="0" y2={H}
              stroke="var(--text-muted)" strokeWidth="0.25" strokeDasharray="1.5,1.5"
              style={{ transform: `translateX(${hoverX}px)`, transition: "transform 0.09s linear" }}
            />
            <circle cx={hoverX!} cy={hoverY!} r="1" fill="var(--win)" stroke="var(--background)" strokeWidth="0.5" style={{ transition: "cx 0.09s linear, cy 0.09s linear" }} />
          </>
        )}
      </svg>
      <div className="relative">
        <div className="text-[11px] text-text-muted uppercase tracking-[0.04em]">Account Balance</div>
        <div className="text-[30px] font-extrabold font-mono tabular-nums mt-1">{displayText}</div>
        <div className="text-sm font-bold font-mono mt-0.5" style={{ color: displaySubColor }}>
          {displaySub}
          {hovering && dates[hoverIdx!] && <span className="text-text-muted font-normal ml-1">· {dateShort(dates[hoverIdx!]!)}</span>}
        </div>
      </div>
    </div>
  );
}
