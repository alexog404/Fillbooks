import { computeKpis, money, pnlColorVar, type Trade } from "@/lib/trades";

function arcPt(deg: number, r: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [60 + r * Math.cos(rad), 60 - r * Math.sin(rad)];
}
function mkArc(a1: number, a2: number, r: number): string {
  const [x1, y1] = arcPt(a1, r);
  const [x2, y2] = arcPt(a2, r);
  return `M${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 0,1 ${x2.toFixed(1)},${y2.toFixed(1)}`;
}

export function KpiCards({ weekTrades, allTrades }: { weekTrades: Trade[]; allTrades: Trade[] }) {
  const kpis = computeKpis(weekTrades);
  const grossWin = weekTrades.filter((t) => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(weekTrades.filter((t) => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
  const pfShare = grossWin + grossLoss ? (grossWin / (grossWin + grossLoss)) * 100 : 50;
  const pfCirc = 2 * Math.PI * 24;

  const beCount = weekTrades.filter((t) => t.pnl === 0).length;
  const wTot = Math.max(kpis.winCount + beCount + kpis.lossCount, 1);
  const winFrac = kpis.winCount / wTot, beFrac = beCount / wTot, lossFrac = kpis.lossCount / wTot;
  const aWinEnd = 180 - winFrac * 180, aBeEnd = aWinEnd - beFrac * 180, aLossEnd = aBeEnd - lossFrac * 180;
  const winRatePath = mkArc(180, aWinEnd, 44), beRatePath = mkArc(aWinEnd, aBeEnd, 44), lossRatePath = mkArc(aBeEnd, Math.max(aLossEnd, 0), 44);

  const winLossRatio = Math.abs(kpis.avgLoss) ? kpis.avgWin / Math.abs(kpis.avgLoss) : kpis.avgWin > 0 ? 99 : 0;
  const wlShare = kpis.avgWin + Math.abs(kpis.avgLoss) ? (kpis.avgWin / (kpis.avgWin + Math.abs(kpis.avgLoss))) * 100 : 50;

  const rSorted = [...allTrades].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const rSeries = rSorted.map((t) => t.r ?? 0);
  const avgR = rSeries.length ? rSeries.reduce((s, v) => s + v, 0) / rSeries.length : 0;
  const rMin = Math.min(...rSeries, 0), rMax = Math.max(...rSeries, 0), rRg = rMax - rMin || 1;
  const rStepX = 90 / Math.max(rSeries.length - 1, 1);
  const rSparkPoints = rSeries.map((v, i) => `${(i * rStepX).toFixed(1)},${(34 - ((v - rMin) / rRg) * 30 - 2).toFixed(1)}`).join(" ");
  const rSparkArea = `0,34 ${rSparkPoints} 90,34`;
  const rColorAvg = avgR >= 0 ? "var(--win)" : "var(--loss)";

  return (
    <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
      <Card
        label="Profit Factor"
        value={kpis.profitFactor.toFixed(2)}
        visual={
          <svg width="52" height="52" viewBox="0 0 52 52" className="flex-none">
            <circle cx="26" cy="26" r="24" fill="none" stroke="var(--loss)" strokeWidth="5" />
            <circle
              cx="26" cy="26" r="24" fill="none" stroke="var(--win)" strokeWidth="5"
              strokeDasharray={pfCirc.toFixed(1)} strokeDashoffset={(pfCirc * (1 - pfShare / 100)).toFixed(1)}
              transform="rotate(-90 26 26)" strokeLinecap="round"
            />
          </svg>
        }
      />

      <Card
        label="Trade Win %"
        value={kpis.winRate.toFixed(1) + "%"}
        visual={
          <div className="flex-none text-center">
            <svg width="72" height="42" viewBox="0 0 120 65" style={{ overflow: "visible" }}>
              <path d={winRatePath} fill="none" strokeWidth="9" strokeLinecap="round" stroke="var(--win)" />
              <path d={beRatePath} fill="none" strokeWidth="9" strokeLinecap="round" stroke="#3b82f6" />
              <path d={lossRatePath} fill="none" strokeWidth="9" strokeLinecap="round" stroke="var(--loss)" />
            </svg>
            <div className="flex gap-1 justify-center mt-0.5">
              <span className="text-[12.5px] font-bold px-1.5 rounded-full" style={{ background: "color-mix(in srgb, var(--win) 13%, transparent)", color: "var(--win)" }}>{kpis.winCount}</span>
              <span className="text-[12.5px] font-bold px-1.5 rounded-full" style={{ background: "rgba(59,130,246,0.13)", color: "#3b82f6" }}>{beCount}</span>
              <span className="text-[12.5px] font-bold px-1.5 rounded-full" style={{ background: "color-mix(in srgb, var(--loss) 13%, transparent)", color: "var(--loss)" }}>{kpis.lossCount}</span>
            </div>
          </div>
        }
      />

      <Card
        label="Avg Win / Loss"
        value={winLossRatio.toFixed(2)}
        sub={
          <>
            <div className="w-[110px] h-2 rounded overflow-hidden flex mt-2">
              <div className="h-full" style={{ width: `${wlShare.toFixed(1)}%`, background: "var(--win)" }} />
              <div className="h-full" style={{ width: `${(100 - wlShare).toFixed(1)}%`, background: "var(--loss)" }} />
            </div>
            <div className="flex justify-between w-[110px] text-[13px] font-mono mt-0.5">
              <span style={{ color: "var(--win)" }}>{money(kpis.avgWin, true)}</span>
              <span style={{ color: "var(--loss)" }}>{money(kpis.avgLoss, false)}</span>
            </div>
          </>
        }
      />

      <Card
        label="Trade Expectancy"
        value={money(kpis.expectancy, true)}
        valueColor={pnlColorVar(kpis.expectancy)}
        sub={<div className="text-[14px] text-text-muted mt-1">per trade</div>}
      />

      <Card
        label="Average R"
        value={avgR.toFixed(2) + "R"}
        valueColor={rColorAvg}
        visual={
          <svg width="90" height="34" viewBox="0 0 90 34" className="flex-none">
            <defs>
              <linearGradient id="rSparkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={rColorAvg} stopOpacity="0.6" />
                <stop offset="100%" stopColor={rColorAvg} stopOpacity="0" />
              </linearGradient>
            </defs>
            <polyline points={rSparkArea} fill="url(#rSparkGrad)" stroke="none" />
            <polyline points={rSparkPoints} fill="none" stroke={rColorAvg} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        }
      />
    </div>
  );
}

function Card({
  label,
  value,
  valueColor,
  sub,
  visual,
}: {
  label: string;
  value: string;
  valueColor?: string;
  sub?: React.ReactNode;
  visual?: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-border rounded-[10px] px-4 py-3.5 flex items-center justify-between gap-2.5">
      <div>
        <div className="text-[14px] text-text-muted mb-2 uppercase tracking-[0.04em]">{label}</div>
        <div className="text-[24px] font-bold font-mono tabular-nums" style={valueColor ? { color: valueColor } : undefined}>{value}</div>
        {sub}
      </div>
      {visual}
    </div>
  );
}
