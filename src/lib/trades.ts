import type { trades as tradesTable } from "@/db/schema";

export type Trade = typeof tradesTable.$inferSelect;

export function money(n: number, forceSign = false): string {
  const sign = n < 0 ? "-" : forceSign && n > 0 ? "+" : "";
  return sign + "$" + Math.abs(n).toFixed(2);
}

export function moneyCompact(n: number): string {
  const sign = n < 0 ? "-" : n > 0 ? "+" : "";
  const abs = Math.abs(n);
  const num = abs >= 1000 ? (abs / 1000).toFixed(abs >= 10000 ? 0 : 1) + "k" : abs.toFixed(0);
  return sign + "$" + num;
}

/** CSS custom-property references, not resolved colors -- consumers apply
 * these via inline `style`, matching the pattern in theme-toggle.tsx,
 * since Tailwind can't express a runtime-chosen CSS variable as a class. */
export function pnlColorVar(n: number): string {
  return n > 0 ? "var(--win)" : n < 0 ? "var(--loss)" : "var(--text-muted)";
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function dateShort(d: string): string {
  const p = d.split("-");
  return MONTH_NAMES[parseInt(p[1], 10) - 1].slice(0, 3) + " " + parseInt(p[2], 10);
}

export function fmtDay(d: string): string {
  const dt = new Date(d + "T00:00:00");
  return dt.getMonth() + 1 + "/" + dt.getDate();
}

export function fmtLocal(dt: Date): string {
  return dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
}

export function mondayOf(d: string): string {
  const dt = new Date(d + "T00:00:00");
  const day = dt.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  dt.setDate(dt.getDate() + diff);
  return fmtLocal(dt);
}

export function fridayOf(d: string): string {
  const dt = new Date(mondayOf(d) + "T00:00:00");
  dt.setDate(dt.getDate() + 4);
  return fmtLocal(dt);
}

export function parseMonthKey(k: string): { y: number; m: number } {
  const [y, m] = k.split("-").map(Number);
  return { y, m: m - 1 };
}

export function shiftMonthKey(k: string, delta: number): string {
  const { y, m } = parseMonthKey(k);
  const d = new Date(y, m + delta, 1);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}

export function monthLabel(k: string): string {
  const { y, m } = parseMonthKey(k);
  return MONTH_NAMES[m] + " " + y;
}

export function formatDuration(seconds: number | null): string {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

export interface Kpis {
  netPnl: number;
  profitFactor: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  expectancy: number;
  winCount: number;
  lossCount: number;
  total: number;
}

export function computeKpis(trades: Trade[]): Kpis {
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl < 0);
  const netPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const grossWin = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossLoss ? grossWin / grossLoss : 0;
  const winRate = trades.length ? (wins.length / trades.length) * 100 : 0;
  const avgWin = wins.length ? grossWin / wins.length : 0;
  const avgLoss = losses.length ? -grossLoss / losses.length : 0;
  const expectancy = trades.length ? netPnl / trades.length : 0;
  return { netPnl, profitFactor, winRate, avgWin, avgLoss, expectancy, winCount: wins.length, lossCount: losses.length, total: trades.length };
}

export interface CalendarCell {
  date: string;
  day: number;
  pnl: number;
  count: number;
  r: number;
  empty?: boolean;
}

export interface CalendarWeek {
  cells: (CalendarCell | null)[];
  total: number;
}

export function buildCalendar(trades: Trade[], year: number, month: number): { weeks: CalendarWeek[] } {
  const byDate: Record<string, { pnl: number; count: number; rSum: number }> = {};
  trades.forEach((t) => {
    if (!byDate[t.date]) byDate[t.date] = { pnl: 0, count: 0, rSum: 0 };
    byDate[t.date].pnl += t.pnl;
    byDate[t.date].count += 1;
    byDate[t.date].rSum += t.r ?? 0;
  });
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay();
  const cells: (CalendarCell | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const day = byDate[iso];
    cells.push(day ? { date: iso, day: d, pnl: day.pnl, count: day.count, r: day.rSum } : { date: iso, day: d, pnl: 0, count: 0, r: 0, empty: true });
  }
  const weeks: CalendarWeek[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    const w = cells.slice(i, i + 7);
    while (w.length < 7) w.push(null);
    const total = w.reduce((sum, c) => sum + (c && !c.empty ? c.pnl : 0), 0);
    weeks.push({ cells: w, total });
  }
  return { weeks };
}
