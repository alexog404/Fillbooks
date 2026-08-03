import { money, pnlColorVar, type Trade } from "./trades";

const DOW_LABELS: [number, string][] = [[1, "Monday"], [2, "Tuesday"], [3, "Wednesday"], [4, "Thursday"], [5, "Friday"]];
const TIME_LABELS: [string, string][] = [["930", "9:30–10:00"], ["1000", "10:00–10:30"], ["1030", "10:30–11:00"], ["1100", "11:00–11:30"]];
const PRICE_BUCKETS: [number, number, string][] = [[0, 2, "$0–2"], [2, 5, "$2–5"], [5, 10, "$5–10"], [10, 20, "$10–20"], [20, Infinity, "$20+"]];

export interface WinRateBar {
  label: string;
  pct: number;
  color: string;
}

function groupWinRate<K extends string | number>(trades: Trade[], keyFn: (t: Trade) => K, labels: [K, string][]): WinRateBar[] {
  const buckets = new Map<K, Trade[]>();
  trades.forEach((t) => {
    const k = keyFn(t);
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k)!.push(t);
  });
  return labels.map(([key, label]) => {
    const arr = buckets.get(key) ?? [];
    const wr = arr.length ? (arr.filter((t) => t.pnl > 0).length / arr.length) * 100 : 0;
    return { label, pct: wr, color: wr >= 50 ? "var(--win)" : "var(--loss)" };
  });
}

export function winRateByTimeOfDay(trades: Trade[]): WinRateBar[] {
  const timeBucket = (t: Trade) => {
    const h = parseInt(t.time.slice(0, 2), 10);
    const m = parseInt(t.time.slice(3, 5), 10);
    const mins = h * 60 + m;
    if (mins < 600) return "930";
    if (mins < 630) return "1000";
    if (mins < 660) return "1030";
    return "1100";
  };
  return groupWinRate(trades, timeBucket, TIME_LABELS);
}

export function winRateByDayOfWeek(trades: Trade[]): WinRateBar[] {
  const dowBucket = (t: Trade) => new Date(t.date + "T00:00:00").getDay();
  return groupWinRate(trades, dowBucket, DOW_LABELS);
}

export interface PriceBar {
  label: string;
  pct: number;
  shares: number;
}

export function averagePriceDistribution(trades: Trade[]): PriceBar[] {
  const shareTotals = PRICE_BUCKETS.map(([lo, hi]) =>
    trades.filter((t) => {
      const p = (t.entry + t.exit) / 2;
      return p >= lo && p < hi;
    }).reduce((s, t) => s + t.qty, 0),
  );
  const max = Math.max(...shareTotals, 1);
  return PRICE_BUCKETS.map(([, , label], i) => ({ label, pct: (shareTotals[i] / max) * 100, shares: shareTotals[i] }));
}

export interface RStat {
  label: string;
  value: string;
  color: string;
}

/** Only trades with a real R (target/stop set on Trade Detail) count --
 * CSV-imported trades start with none, so this can legitimately be empty
 * for a while. Returns null rather than misleading zeros in that case. */
export function rMultipleStats(trades: Trade[]): RStat[] | null {
  const rVals = trades.map((t) => t.r).filter((r): r is number => r != null);
  if (rVals.length === 0) return null;
  const avg = rVals.reduce((s, v) => s + v, 0) / rVals.length;
  const wins = rVals.filter((v) => v > 0);
  const losses = rVals.filter((v) => v < 0);
  const avgWin = wins.length ? wins.reduce((s, v) => s + v, 0) / wins.length : 0;
  const avgLoss = losses.length ? losses.reduce((s, v) => s + v, 0) / losses.length : 0;
  const best = Math.max(...rVals);
  const worst = Math.min(...rVals);
  return [
    { label: "Avg R", value: avg.toFixed(2) + "R", color: pnlColorVar(avg) },
    { label: "Avg Winning R", value: "+" + avgWin.toFixed(2) + "R", color: "var(--win)" },
    { label: "Avg Losing R", value: avgLoss.toFixed(2) + "R", color: "var(--loss)" },
    { label: "Best R", value: (best >= 0 ? "+" : "") + best.toFixed(2) + "R", color: "var(--win)" },
    { label: "Worst R", value: worst.toFixed(2) + "R", color: "var(--loss)" },
  ];
}

export interface RHistogramBar {
  label: string;
  avgR: number;
  barHeightPct: number;
  color: string;
}

export function rHistogramByDay(trades: Trade[], dateShortFn: (d: string) => string): RHistogramBar[] | null {
  const withR = trades.filter((t) => t.r != null);
  if (withR.length === 0) return null;
  const byDate = new Map<string, number[]>();
  withR.forEach((t) => {
    if (!byDate.has(t.date)) byDate.set(t.date, []);
    byDate.get(t.date)!.push(t.r!);
  });
  const dates = [...byDate.keys()].sort();
  const avgs = dates.map((d) => {
    const vals = byDate.get(d)!;
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  });
  const maxAbs = Math.max(...avgs.map((v) => Math.abs(v)), 0.1);
  return dates.map((d, i) => ({
    label: dateShortFn(d),
    avgR: avgs[i],
    barHeightPct: (Math.abs(avgs[i]) / maxAbs) * 100,
    color: avgs[i] < 0 ? "var(--loss)" : "var(--win)",
  }));
}

export interface StatCell {
  label: string;
  value: string;
  color?: string;
}

/** Real, honest statistics only -- the mockup's own "Total Commissions"/
 * "MAE/MFE" rows used fabricated per-share fee estimates and fake
 * intraday-excursion data neither of which we have real numbers for, so
 * they're left out entirely rather than shown with made-up values. */
export function computeStatRows(trades: Trade[]): StatCell[][] {
  const count = trades.length || 1;
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const wins = trades.filter((t) => t.pnl > 0.5);
  const losses = trades.filter((t) => t.pnl < -0.5);
  const scratch = trades.filter((t) => Math.abs(t.pnl) <= 0.5);
  const largestGain = wins.length ? Math.max(...wins.map((t) => t.pnl)) : 0;
  const largestLoss = losses.length ? Math.min(...losses.map((t) => t.pnl)) : 0;
  const days = new Set(trades.map((t) => t.date)).size || 1;
  const totalShares = trades.reduce((s, t) => s + t.qty, 0) || 1;
  const avgWinTrade = wins.length ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
  const avgLossTrade = losses.length ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length : 0;

  const holdMinutes = (list: Trade[]) => {
    const withDur = list.filter((t) => t.durationSeconds != null);
    if (withDur.length === 0) return 0;
    return withDur.reduce((s, t) => s + t.durationSeconds! / 60, 0) / withDur.length;
  };

  const sorted = [...trades].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  let curWin = 0, curLoss = 0, maxWin = 0, maxLoss = 0;
  sorted.forEach((t) => {
    if (t.pnl > 0) { curWin++; curLoss = 0; } else if (t.pnl < 0) { curLoss++; curWin = 0; } else { curWin = 0; curLoss = 0; }
    maxWin = Math.max(maxWin, curWin);
    maxLoss = Math.max(maxLoss, curLoss);
  });

  const meanPnl = totalPnl / count;
  const variance = trades.reduce((s, t) => s + (t.pnl - meanPnl) ** 2, 0) / count;
  const stdDev = Math.sqrt(variance);
  const sqn = stdDev ? (meanPnl / stdDev) * Math.sqrt(count) : 0;
  const normCdf = (z: number) => 1 - 0.5 * Math.exp(-0.717 * z - 0.416 * z * z);
  const probRandom = Math.max(0, Math.min(100, (1 - normCdf(Math.max(sqn, 0))) * 100));

  const winRateFrac = wins.length / count;
  const wlRatio = avgLossTrade ? Math.abs(avgWinTrade / avgLossTrade) : 0;
  const kelly = wlRatio ? (winRateFrac - (1 - winRateFrac) / wlRatio) * 100 : 0;

  let cum = 0;
  const eqSeries = sorted.map((t) => (cum += t.pnl));
  const n = eqSeries.length;
  let kRatio = 0;
  if (n > 1) {
    const xMean = (n - 1) / 2;
    const yMean = eqSeries.reduce((s, v) => s + v, 0) / n;
    let sxy = 0, sxx = 0;
    eqSeries.forEach((y, i) => {
      sxy += (i - xMean) * (y - yMean);
      sxx += (i - xMean) * (i - xMean);
    });
    const slope = sxx ? sxy / sxx : 0;
    const resid = eqSeries.map((y, i) => y - (yMean + slope * (i - xMean)));
    const stderr = Math.sqrt(resid.reduce((s, r) => s + r * r, 0) / (n - 2 || 1)) / (Math.sqrt(sxx) || 1);
    kRatio = stderr ? slope / stderr / 100 : 0;
  }
  const grossWin = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossLoss ? grossWin / grossLoss : grossWin > 0 ? 99 : 0;

  const mny = (v: number) => money(v, true);

  return [
    [
      { label: "Total Gain/Loss", value: mny(totalPnl), color: pnlColorVar(totalPnl) },
      { label: "Largest Gain", value: mny(largestGain), color: "var(--win)" },
      { label: "Largest Loss", value: mny(largestLoss), color: "var(--loss)" },
    ],
    [
      { label: "Average Daily Gain/Loss", value: mny(totalPnl / days), color: pnlColorVar(totalPnl / days) },
      { label: "Average Daily Volume", value: Math.round(totalShares / days).toLocaleString() },
      { label: "Average Per-share Gain/Loss", value: "$" + (totalPnl / totalShares).toFixed(2) },
    ],
    [
      { label: "Average Trade Gain/Loss", value: mny(meanPnl), color: pnlColorVar(meanPnl) },
      { label: "Average Winning Trade", value: mny(avgWinTrade), color: "var(--win)" },
      { label: "Average Losing Trade", value: mny(avgLossTrade), color: "var(--loss)" },
    ],
    [
      { label: "Total Number of Trades", value: String(trades.length) },
      { label: "Number of Winning Trades", value: `${wins.length} (${((wins.length / count) * 100).toFixed(1)}%)` },
      { label: "Number of Losing Trades", value: `${losses.length} (${((losses.length / count) * 100).toFixed(1)}%)` },
    ],
    [
      { label: "Avg Hold Time (scratch)", value: Math.round(holdMinutes(scratch)) + " min" },
      { label: "Avg Hold Time (winning)", value: Math.round(holdMinutes(wins)) + " min" },
      { label: "Avg Hold Time (losing)", value: Math.round(holdMinutes(losses)) + " min" },
    ],
    [
      { label: "Number of Scratch Trades", value: String(scratch.length) },
      { label: "Max Consecutive Wins", value: String(maxWin) },
      { label: "Max Consecutive Losses", value: String(maxLoss) },
    ],
    [
      { label: "Trade P&L Std Deviation", value: mny(stdDev) },
      { label: "System Quality Number (SQN)", value: sqn.toFixed(2) },
      { label: "Probability of Random Chance", value: probRandom.toFixed(1) + "%" },
    ],
    [
      { label: "Kelly Percentage", value: kelly.toFixed(1) + "%" },
      { label: "K-Ratio", value: kRatio.toFixed(2) },
      { label: "Profit Factor", value: profitFactor.toFixed(2) },
    ],
  ];
}
