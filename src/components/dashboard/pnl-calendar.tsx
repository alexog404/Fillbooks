"use client";

import { useState } from "react";
import Link from "next/link";
import { buildCalendar, dateShort, monthLabel, moneyCompact, money, parseMonthKey, pnlColorVar, shiftMonthKey, type Trade } from "@/lib/trades";

export function PnlCalendar({ trades, startingBalance, initialMonthKey }: { trades: Trade[]; startingBalance: number; initialMonthKey: string }) {
  const [monthKey, setMonthKey] = useState(initialMonthKey);
  const [dayViewDate, setDayViewDate] = useState<string | null>(null);

  const { y, m } = parseMonthKey(monthKey);
  const cal = buildCalendar(trades, y, m);
  const monthPnl = cal.weeks.reduce((s, w) => s + w.total, 0);
  const monthStartStr = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const monthStartBalance = startingBalance + trades.filter((t) => t.date < monthStartStr).reduce((s, t) => s + t.pnl, 0);
  const monthPct = monthStartBalance ? (monthPnl / monthStartBalance) * 100 : 0;
  const monthPctText = (monthPct >= 0 ? "+" : "") + monthPct.toFixed(2) + "%";

  const dayTrades = dayViewDate ? trades.filter((t) => t.date === dayViewDate) : [];

  return (
    <div className="bg-surface border border-border rounded-[10px] px-[18px] py-4 min-w-0">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMonthKey(shiftMonthKey(monthKey, -1))}
            className="w-[22px] h-[22px] rounded-md bg-surface-2 border border-border flex items-center justify-center cursor-pointer text-[15px]"
          >
            ‹
          </button>
          <div className="text-[16px] font-bold">{monthLabel(monthKey)}</div>
          <button
            type="button"
            onClick={() => setMonthKey(shiftMonthKey(monthKey, 1))}
            className="w-[22px] h-[22px] rounded-md bg-surface-2 border border-border flex items-center justify-center cursor-pointer text-[15px]"
          >
            ›
          </button>
          <div className="text-[15px] font-bold font-mono ml-1" style={{ color: pnlColorVar(monthPct) }}>{monthPctText}</div>
        </div>
        <div className="text-[14px] text-text-muted">Click a day with trades for detail</div>
      </div>

      <div className="relative isolate">
        <div
          className="absolute -right-px -top-[3px] -bottom-[3px] rounded-lg pointer-events-none z-0 border-[1.5px]"
          style={{ width: "calc((100% - 42px)/8 + 2px)", borderColor: "var(--primary)", background: "var(--accent-soft)" }}
        />
        <div className="relative z-10 grid grid-cols-8 gap-1.5 mb-1 text-[12px] text-text-muted">
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
          <div className="font-bold text-center" style={{ color: "var(--primary)" }}>Weeks</div>
        </div>
        {cal.weeks.map((week, wi) => (
          <div key={wi} className="relative z-10 grid grid-cols-8 gap-1.5 mb-1.5">
            {week.cells.map((cell, ci) => {
              if (!cell) return <div key={ci} className="h-16" />;
              if (cell.empty) {
                return (
                  <div key={ci} className="h-16 min-w-0 box-border rounded-md p-1 bg-surface-2 border border-border flex flex-col items-center justify-center text-center overflow-hidden">
                    <div className="text-[12.5px] text-text-muted whitespace-nowrap">{cell.day}</div>
                  </div>
                );
              }
              const win = cell.pnl > 0;
              const bg = win ? "var(--win-soft)" : cell.pnl < 0 ? "var(--loss-soft)" : "var(--surface-2)";
              const border = win ? "var(--win)" : cell.pnl < 0 ? "var(--loss)" : "var(--border)";
              return (
                <div
                  key={ci}
                  onClick={() => setDayViewDate(cell.date)}
                  className="h-16 min-w-0 box-border rounded-md p-1 cursor-pointer overflow-hidden flex flex-col items-center justify-center text-center hover:brightness-110"
                  style={{ background: bg, border: `1px solid ${border}` }}
                >
                  <div className="text-[12.5px] text-text-muted whitespace-nowrap">{cell.day}</div>
                  <div className="text-[13px] font-bold font-mono mt-[3px] whitespace-nowrap" style={{ color: pnlColorVar(cell.pnl) }}>{moneyCompact(cell.pnl)}</div>
                  <div className="text-[11px] text-text-muted mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{cell.count}t · {cell.r.toFixed(1)}R</div>
                </div>
              );
            })}
            <div className="h-16 min-w-0 box-border rounded-md bg-surface-2 border border-border flex flex-col items-center justify-center p-1 text-center overflow-hidden">
              <div className="text-[13px] font-bold font-mono whitespace-nowrap" style={{ color: pnlColorVar(week.total) }}>{moneyCompact(week.total)}</div>
              <div className="text-[10.5px] text-text-muted mt-0.5 whitespace-nowrap">W{wi + 1}</div>
            </div>
          </div>
        ))}
      </div>

      <div
        className="overflow-hidden transition-[max-height,opacity,margin-top] duration-300"
        style={{ maxHeight: dayViewDate ? 400 : 0, opacity: dayViewDate ? 1 : 0, marginTop: dayViewDate ? 12 : 0 }}
      >
        <div className="border-t border-border pt-3">
          <div className="text-[15.5px] font-bold mb-2">
            {dayViewDate && dateShort(dayViewDate)} · {dayTrades.length} trade{dayTrades.length !== 1 ? "s" : ""}
          </div>
          {dayTrades.map((t) => (
            <Link
              key={t.id}
              href={`/trades/${t.id}?from=dashboard`}
              className="flex items-center justify-between px-2.5 py-2 rounded-md mb-1 bg-surface-2 hover:bg-surface-hover"
            >
              <div className="flex items-center gap-2">
                <div className="text-[15px] font-bold font-mono">{t.symbol}</div>
                <div className="text-[13.5px] text-text-muted">{t.time}</div>
              </div>
              <div className="text-[15px] font-bold font-mono" style={{ color: pnlColorVar(t.pnl) }}>{money(t.pnl, true)}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
