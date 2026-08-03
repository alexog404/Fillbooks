// Sample data for the trading journal mockups. Static, deterministic, no real API calls.

export const setups = [
  { id: 'micro-pullback', label: 'Micro Pullback', icon: '◢' },
  { id: 'bull-flag', label: 'Bull Flag', icon: '⚑' },
  { id: 'flat-top-breakout', label: 'Flat Top Breakout', icon: '⌐' },
  { id: 'gap-and-go', label: 'Gap and Go', icon: '↗' },
  { id: 'first-pullback', label: 'First Pullback', icon: '↘' },
  { id: 'no-setup', label: 'No Setup', icon: '×' },
];

export const trades = [
  { id: 1, date: '2026-07-06', time: '09:31:12', symbol: 'SOFI', side: 'long', qty: 800, entry: 8.42, exit: 8.71, pnl: 232.0, r: 1.8, setup: 'gap-and-go', duration: '4m 12s', status: 'closed', hasNote: true, mistakes: ['chased'], habits: ['followed plan'], rating: 4, target: 8.85, stop: 8.30, mae: -0.06, mfe: 0.34 },
  { id: 2, date: '2026-07-06', time: '09:38:44', symbol: 'ATER', side: 'long', qty: 1200, entry: 2.14, exit: 2.05, pnl: -108.0, r: -0.9, setup: 'micro-pullback', duration: '2m 03s', status: 'closed', hasNote: true, mistakes: ['early entry'], habits: [], rating: 2, target: 2.30, stop: 2.06, mae: -0.09, mfe: 0.02 },
  { id: 3, date: '2026-07-06', time: '10:02:31', symbol: 'PHUN', side: 'long', qty: 2000, entry: 1.31, exit: 1.42, pnl: 220.0, r: 2.1, setup: 'bull-flag', duration: '6m 41s', status: 'closed', hasNote: false, mistakes: [], habits: ['sized correctly'], rating: 5, target: 1.44, stop: 1.25, mae: -0.02, mfe: 0.13 },
  { id: 4, date: '2026-07-07', time: '09:33:02', symbol: 'MULN', side: 'long', qty: 3000, entry: 0.62, exit: 0.58, pnl: -120.0, r: -1.1, setup: 'flat-top-breakout', duration: '1m 55s', status: 'closed', hasNote: true, mistakes: ['no catalyst', 'oversized'], habits: [], rating: 1, target: 0.68, stop: 0.59, mae: -0.05, mfe: 0.01 },
  { id: 5, date: '2026-07-07', time: '09:47:19', symbol: 'BBIG', side: 'short', qty: 1500, entry: 3.05, exit: 2.88, pnl: 255.0, r: 1.6, setup: 'first-pullback', duration: '5m 08s', status: 'closed', hasNote: true, mistakes: [], habits: ['waited for confirmation'], rating: 4, target: 2.80, stop: 3.15, mae: -0.04, mfe: 0.21 },
  { id: 6, date: '2026-07-08', time: '09:31:47', symbol: 'SOFI', side: 'long', qty: 1000, entry: 8.05, exit: 8.05, pnl: 0.0, r: 0.0, setup: 'gap-and-go', duration: '0m 48s', status: 'closed', hasNote: false, mistakes: ['no catalyst'], habits: [], rating: 3, target: 8.20, stop: 7.95, mae: -0.03, mfe: 0.03 },
  { id: 7, date: '2026-07-09', time: '09:35:55', symbol: 'CTRM', side: 'long', qty: 5000, entry: 0.41, exit: 0.36, pnl: -250.0, r: -1.4, setup: 'micro-pullback', duration: '3m 20s', status: 'closed', hasNote: true, mistakes: ['held through stop', 'late entry'], habits: [], rating: 1, target: 0.46, stop: 0.39, mae: -0.06, mfe: 0.01 },
  { id: 8, date: '2026-07-09', time: '10:12:08', symbol: 'TELL', side: 'long', qty: 900, entry: 1.98, exit: 2.21, pnl: 207.0, r: 2.3, setup: 'bull-flag', duration: '7m 14s', status: 'closed', hasNote: true, mistakes: [], habits: ['followed plan', 'sized correctly'], rating: 5, target: 2.24, stop: 1.88, mae: -0.02, mfe: 0.24,
    partials: {
      entries: [ { time: '10:12:08', price: 1.98, qty: 500 }, { time: '10:12:41', price: 2.01, qty: 400 } ],
      exits: [ { time: '10:17:55', price: 2.15, qty: 600 }, { time: '10:19:22', price: 2.21, qty: 300 } ],
    }
  },
  { id: 9, date: '2026-07-10', time: '09:41:29', symbol: 'XELA', side: 'long', qty: 4000, entry: 0.29, exit: 0.31, pnl: 80.0, r: 0.9, setup: 'flat-top-breakout', duration: '2m 39s', status: 'closed', hasNote: false, mistakes: [], habits: [], rating: 3, target: 0.33, stop: 0.27, mae: -0.01, mfe: 0.03 },
  { id: 10, date: '2026-07-10', time: '10:05:14', symbol: 'GNUS', side: 'short', qty: 1800, entry: 1.55, exit: 1.62, pnl: -126.0, r: -0.8, setup: 'first-pullback', duration: '3m 47s', status: 'closed', hasNote: true, mistakes: ['chased', 'early entry'], habits: [], rating: 2, target: 1.42, stop: 1.61, mae: -0.07, mfe: 0.0 },
  { id: 11, date: '2026-07-13', time: '09:32:51', symbol: 'SNDL', side: 'long', qty: 2500, entry: 2.02, exit: 2.19, pnl: 425.0, r: 2.7, setup: 'gap-and-go', duration: '5m 33s', status: 'closed', hasNote: true, mistakes: [], habits: ['followed plan'], rating: 5, target: 2.22, stop: 1.94, mae: -0.03, mfe: 0.19 },
  { id: 12, date: '2026-07-13', time: '10:22:03', symbol: 'ATER', side: 'long', qty: 1000, entry: 2.31, exit: 2.24, pnl: -70.0, r: -0.6, setup: 'micro-pullback', duration: '1m 41s', status: 'closed', hasNote: false, mistakes: ['late entry'], habits: [], rating: 2, target: 2.42, stop: 2.25, mae: -0.08, mfe: 0.01 },
  { id: 13, date: '2026-07-14', time: '09:36:40', symbol: 'PHUN', side: 'long', qty: 1600, entry: 1.19, exit: 1.19, pnl: -12.0, r: -0.1, setup: 'no-setup', duration: '0m 55s', status: 'closed', hasNote: true, mistakes: ['no catalyst', 'oversized'], habits: [], rating: 1, target: 1.28, stop: 1.14, mae: -0.05, mfe: 0.02 },
  { id: 14, date: '2026-07-14', time: '09:52:17', symbol: 'MULN', side: 'long', qty: 2800, entry: 0.58, exit: 0.66, pnl: 224.0, r: 1.9, setup: 'bull-flag', duration: '6m 02s', status: 'closed', hasNote: true, mistakes: [], habits: ['sized correctly', 'waited for confirmation'], rating: 4, target: 0.67, stop: 0.54, mae: -0.02, mfe: 0.11 },
  { id: 15, date: '2026-07-15', time: '09:34:22', symbol: 'BBIG', side: 'short', qty: 1300, entry: 2.74, exit: 2.61, pnl: 169.0, r: 1.4, setup: 'first-pullback', duration: '4m 29s', status: 'closed', hasNote: false, mistakes: [], habits: [], rating: 4, target: 2.58, stop: 2.82, mae: -0.03, mfe: 0.15 },
  { id: 16, date: '2026-07-16', time: '09:30:58', symbol: 'SOFI', side: 'long', qty: 1400, entry: 8.61, exit: 8.94, pnl: 462.0, r: 3.1, setup: 'gap-and-go', duration: '8m 51s', status: 'closed', hasNote: true, mistakes: [], habits: ['followed plan', 'sized correctly'], rating: 5, target: 8.95, stop: 8.44, mae: -0.04, mfe: 0.35 },
  { id: 17, date: '2026-07-16', time: '10:41:03', symbol: 'CTRM', side: 'long', qty: 6000, entry: 0.38, exit: 0.35, pnl: -180.0, r: -1.0, setup: 'micro-pullback', duration: '2m 15s', status: 'closed', hasNote: true, mistakes: ['chased'], habits: [], rating: 2, target: 0.43, stop: 0.36, mae: -0.05, mfe: 0.01 },
  { id: 18, date: '2026-07-17', time: '09:33:37', symbol: 'TELL', side: 'long', qty: 700, entry: 2.05, exit: 1.97, pnl: -56.0, r: -0.6, setup: 'flat-top-breakout', duration: '1m 28s', status: 'closed', hasNote: false, mistakes: ['early entry'], habits: [], rating: 2, target: 2.18, stop: 1.99, mae: -0.09, mfe: 0.0 },
  { id: 19, date: '2026-07-17', time: '10:09:51', symbol: 'GNUS', side: 'long', qty: 3200, entry: 1.11, exit: 1.24, pnl: 416.0, r: 2.5, setup: 'bull-flag', duration: '6m 47s', status: 'closed', hasNote: true, mistakes: [], habits: ['followed plan'], rating: 5, target: 1.26, stop: 1.05, mae: -0.03, mfe: 0.15 },
  { id: 20, date: '2026-07-20', time: '09:31:19', symbol: 'SNDL', side: 'long', qty: 2200, entry: 1.94, exit: 1.88, pnl: -132.0, r: -0.9, setup: 'first-pullback', duration: '2m 51s', status: 'closed', hasNote: true, mistakes: ['held through stop'], habits: [], rating: 1, target: 2.06, stop: 1.90, mae: -0.06, mfe: 0.02 },
  { id: 33, date: '2026-07-21', time: '09:32:10', symbol: 'RIOT', side: 'long', qty: 1500, entry: 9.42, exit: 9.42, pnl: 0.0, r: 0.0, setup: 'gap-and-go', duration: '—', status: 'working', hasNote: false, mistakes: [], habits: [], rating: 0, target: 9.80, stop: 9.20, mae: 0, mfe: 0 },
  { id: 34, date: '2026-07-22', time: '09:34:55', symbol: 'MARA', side: 'short', qty: 1100, entry: 14.28, exit: 14.28, pnl: 0.0, r: 0.0, setup: 'first-pullback', duration: '—', status: 'working', hasNote: false, mistakes: [], habits: [], rating: 0, target: 13.90, stop: 14.50, mae: 0, mfe: 0 },
  { id: 35, date: '2026-07-23', time: '09:31:40', symbol: 'AMC', side: 'long', qty: 3400, entry: 3.02, exit: 3.02, pnl: 0.0, r: 0.0, setup: 'micro-pullback', duration: '—', status: 'cancelled', hasNote: false, mistakes: ['no fill'], habits: [], rating: 0, target: 3.15, stop: 2.92, mae: 0, mfe: 0 },
  { id: 21, date: '2026-06-01', time: '09:31:05', symbol: 'SOFI', side: 'long', qty: 900, entry: 7.88, exit: 8.12, pnl: 216.0, r: 1.7, setup: 'gap-and-go', duration: '3m 40s', status: 'closed', hasNote: false, mistakes: [], habits: ['followed plan'], rating: 4, target: 8.20, stop: 7.75, mae: -0.04, mfe: 0.28 },
  { id: 22, date: '2026-06-01', time: '09:44:12', symbol: 'MULN', side: 'long', qty: 2600, entry: 0.55, exit: 0.51, pnl: -104.0, r: -1.0, setup: 'micro-pullback', duration: '2m 10s', status: 'closed', hasNote: true, mistakes: ['chased'], habits: [], rating: 2, target: 0.60, stop: 0.52, mae: -0.05, mfe: 0.01 },
  { id: 23, date: '2026-06-02', time: '09:33:47', symbol: 'PHUN', side: 'long', qty: 1800, entry: 1.22, exit: 1.35, pnl: 234.0, r: 2.0, setup: 'bull-flag', duration: '5m 05s', status: 'closed', hasNote: true, mistakes: [], habits: ['sized correctly'], rating: 5, target: 1.38, stop: 1.16, mae: -0.02, mfe: 0.15 },
  { id: 24, date: '2026-06-03', time: '09:31:52', symbol: 'BBIG', side: 'short', qty: 1400, entry: 2.95, exit: 2.80, pnl: 210.0, r: 1.5, setup: 'first-pullback', duration: '4m 18s', status: 'closed', hasNote: false, mistakes: [], habits: ['waited for confirmation'], rating: 4, target: 2.75, stop: 3.04, mae: -0.03, mfe: 0.18 },
  { id: 25, date: '2026-06-03', time: '10:01:33', symbol: 'ATER', side: 'long', qty: 1100, entry: 2.20, exit: 2.11, pnl: -99.0, r: -0.7, setup: 'micro-pullback', duration: '1m 52s', status: 'closed', hasNote: true, mistakes: ['early entry'], habits: [], rating: 2, target: 2.35, stop: 2.12, mae: -0.07, mfe: 0.02 },
  { id: 26, date: '2026-06-08', time: '09:32:20', symbol: 'TELL', side: 'long', qty: 950, entry: 2.02, exit: 2.24, pnl: 209.0, r: 2.2, setup: 'bull-flag', duration: '6m 30s', status: 'closed', hasNote: true, mistakes: [], habits: ['followed plan', 'sized correctly'], rating: 5, target: 2.28, stop: 1.92, mae: -0.02, mfe: 0.22 },
  { id: 27, date: '2026-06-09', time: '09:35:11', symbol: 'CTRM', side: 'long', qty: 5200, entry: 0.39, exit: 0.35, pnl: -208.0, r: -1.3, setup: 'micro-pullback', duration: '2m 47s', status: 'closed', hasNote: true, mistakes: ['held through stop'], habits: [], rating: 1, target: 0.44, stop: 0.37, mae: -0.06, mfe: 0.01 },
  { id: 28, date: '2026-06-10', time: '09:31:38', symbol: 'SNDL', side: 'long', qty: 2100, entry: 1.85, exit: 1.99, pnl: 294.0, r: 1.9, setup: 'gap-and-go', duration: '4m 55s', status: 'closed', hasNote: false, mistakes: [], habits: ['followed plan'], rating: 4, target: 2.02, stop: 1.76, mae: -0.03, mfe: 0.20 },
  { id: 29, date: '2026-06-15', time: '09:40:04', symbol: 'GNUS', side: 'short', qty: 1700, entry: 1.48, exit: 1.55, pnl: -119.0, r: -0.8, setup: 'first-pullback', duration: '3m 12s', status: 'closed', hasNote: true, mistakes: ['chased'], habits: [], rating: 2, target: 1.36, stop: 1.56, mae: -0.05, mfe: 0.0 },
  { id: 30, date: '2026-06-17', time: '09:33:15', symbol: 'SOFI', side: 'long', qty: 1300, entry: 8.20, exit: 8.58, pnl: 494.0, r: 3.0, setup: 'gap-and-go', duration: '7m 40s', status: 'closed', hasNote: true, mistakes: [], habits: ['followed plan', 'sized correctly'], rating: 5, target: 8.60, stop: 8.02, mae: -0.04, mfe: 0.40 },
  { id: 31, date: '2026-06-22', time: '09:31:29', symbol: 'MULN', side: 'long', qty: 2900, entry: 0.60, exit: 0.56, pnl: -116.0, r: -1.1, setup: 'flat-top-breakout', duration: '1m 48s', status: 'closed', hasNote: true, mistakes: ['no catalyst'], habits: [], rating: 1, target: 0.66, stop: 0.57, mae: -0.05, mfe: 0.01 },
  { id: 32, date: '2026-06-24', time: '09:36:52', symbol: 'PHUN', side: 'long', qty: 2000, entry: 1.28, exit: 1.41, pnl: 260.0, r: 2.1, setup: 'bull-flag', duration: '5m 20s', status: 'closed', hasNote: false, mistakes: [], habits: ['sized correctly'], rating: 5, target: 1.44, stop: 1.22, mae: -0.02, mfe: 0.16 },
];

export function fmtMoney(n, opts = {}) {
  const sign = n < 0 ? '-' : (opts.forceSign ? '+' : '');
  return sign + '$' + Math.abs(n).toFixed(2);
}

export function buildCalendar(trades, year, month) {
  const byDate = {};
  trades.forEach(t => {
    if (!byDate[t.date]) byDate[t.date] = { pnl: 0, count: 0, rSum: 0 };
    byDate[t.date].pnl += t.pnl;
    byDate[t.date].count += 1;
    byDate[t.date].rSum += t.r;
  });
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const day = byDate[iso];
    cells.push(day ? { date: iso, day: d, pnl: day.pnl, count: day.count, r: day.rSum } : { date: iso, day: d, empty: true });
  }
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    const w = cells.slice(i, i + 7);
    while (w.length < 7) w.push(null);
    weeks.push(w);
  }
  const weekTotals = weeks.map(w => w.reduce((sum, c) => sum + (c && !c.empty ? c.pnl : 0), 0));
  return { weeks, weekTotals };
}

export function computeKpis(trades) {
  const wins = trades.filter(t => t.pnl > 0);
  const losses = trades.filter(t => t.pnl < 0);
  const netPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const grossWin = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossLoss ? grossWin / grossLoss : 0;
  const winRate = trades.length ? (wins.length / trades.length) * 100 : 0;
  const avgWin = wins.length ? grossWin / wins.length : 0;
  const avgLoss = losses.length ? -grossLoss / losses.length : 0;
  const expectancy = trades.length ? netPnl / trades.length : 0;
  let streak = 0, streakType = null;
  for (let i = trades.length - 1; i >= 0; i--) {
    const isWin = trades[i].pnl > 0;
    if (streakType === null) { streakType = isWin; streak = 1; }
    else if (isWin === streakType) streak++;
    else break;
  }
  return { netPnl, profitFactor, winRate, avgWin, avgLoss, expectancy, streak, streakType, winCount: wins.length, lossCount: losses.length, total: trades.length };
}

export function computeSetupStats(trades, setupId) {
  const list = trades.filter(t => t.setup === setupId);
  const kpis = computeKpis(list);
  return { ...kpis, trades: list };
}

export function generateCandles(entry, exit, seed, count = 60) {
  let price = entry * 0.998;
  const candles = [];
  let rnd = seed;
  const rand = () => { rnd = (rnd * 9301 + 49297) % 233280; return rnd / 233280; };
  const trendPerStep = (exit - entry) / count;
  for (let i = 0; i < count; i++) {
    const noise = (rand() - 0.5) * Math.abs(entry) * 0.012;
    const open = price;
    const close = open + trendPerStep + noise;
    const high = Math.max(open, close) + rand() * Math.abs(entry) * 0.004;
    const low = Math.min(open, close) - rand() * Math.abs(entry) * 0.004;
    const volume = 4000 + rand() * 18000;
    candles.push({ open, high, low, close, volume });
    price = close;
  }
  return candles;
}
