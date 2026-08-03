import { dateShort, money, pnlColorVar, type Trade } from "@/lib/trades";

export function DailyPnlChart({ trades }: { trades: Trade[] }) {
  const sortedByDate = [...trades].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  let cum = 0;
  const eqVals = sortedByDate.map((t) => (cum += t.pnl));
  const equityEnd = eqVals[eqVals.length - 1] || 0;

  const dayMap: Record<string, number> = {};
  trades.forEach((t) => {
    dayMap[t.date] = (dayMap[t.date] || 0) + t.pnl;
  });
  const dayDates = Object.keys(dayMap).sort();

  if (dayDates.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-[10px] px-[18px] py-4">
        <div className="text-[16px] font-bold mb-2">Daily P&amp;L — Win vs Loss Days</div>
        <div className="h-[210px] flex items-center justify-center text-sm text-text-muted">No trades yet.</div>
      </div>
    );
  }

  const dayVals = dayDates.map((d) => dayMap[d]);
  const dayAbsMax = Math.max(...dayVals.map((v) => Math.abs(v)), 100);
  const chartW = 560, chartH = 210, baseY = chartH / 2;
  const barSlot = chartW / dayVals.length;
  const barW = Math.max(barSlot * 0.55, 6);
  const dayBars = dayDates.map((d, i) => {
    const v = dayMap[d];
    const h = (Math.abs(v) / dayAbsMax) * (chartH / 2 - 10);
    const x = i * barSlot + (barSlot - barW) / 2;
    return { x, y: v >= 0 ? baseY - h : baseY, w: barW, h, color: pnlColorVar(v) };
  });
  const eqTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => {
    const val = dayAbsMax - f * dayAbsMax * 2;
    return { y: f * chartH, label: (val >= 0 ? "$" : "-$") + Math.abs(Math.round(val)).toLocaleString() };
  });
  const xIdxD = [0, Math.floor((dayDates.length - 1) * 0.4), Math.floor((dayDates.length - 1) * 0.7), dayDates.length - 1];
  const eqXLabels = [...new Set(xIdxD)].map((i) => ({ x: (((i * barSlot + barSlot / 2) / chartW) * 100).toFixed(1) + "%", label: dateShort(dayDates[i]) }));

  return (
    <div className="bg-surface border border-border rounded-[10px] px-[18px] py-4">
      <div className="flex items-center justify-between mb-2.5">
        <div className="text-[16px] font-bold">Daily P&amp;L — Win vs Loss Days</div>
        <div className="text-xs font-bold font-mono" style={{ color: pnlColorVar(equityEnd) }}>{money(equityEnd, true)}</div>
      </div>
      <div className="flex">
        <div className="flex flex-col justify-between h-[210px] pr-2 text-[10px] text-text-muted font-mono text-right">
          {eqTicks.map((tk, i) => (
            <div key={i}>{tk.label}</div>
          ))}
        </div>
        <div className="flex-1 min-w-0">
          <svg width="100%" height="210" viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="none">
            {eqTicks.map((tk, i) => (
              <line key={i} x1="0" y1={tk.y} x2={chartW} y2={tk.y} stroke="var(--chart-grid)" strokeWidth="1" strokeDasharray="3,4" />
            ))}
            <line x1="0" y1={baseY} x2={chartW} y2={baseY} stroke="var(--border)" strokeWidth="1" />
            {dayBars.map((bar, i) => (
              <rect key={i} x={bar.x} y={bar.y} width={bar.w} height={bar.h} fill={bar.color} rx="2" />
            ))}
          </svg>
          <div className="relative h-4">
            {eqXLabels.map((xl, i) => (
              <div key={i} className="absolute top-0 text-[10px] text-text-muted whitespace-nowrap" style={{ left: xl.x, transform: "translateX(-50%)" }}>
                {xl.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
