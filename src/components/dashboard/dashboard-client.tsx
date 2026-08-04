"use client";

import { useState } from "react";
import { DateRangePicker } from "@/components/date-range-picker";
import { AccountBalanceCard } from "./account-balance-card";
import { KpiCards } from "./kpi-cards";
import { PnlCalendar } from "./pnl-calendar";
import { RecentTrades } from "./recent-trades";
import { DailyPnlChart } from "./daily-pnl-chart";
import { fmtDay, fmtLocal, fridayOf, mondayOf, type Trade } from "@/lib/trades";

export function DashboardClient({ trades, startingBalance }: { trades: Trade[]; startingBalance: number }) {
  const allDates = [...new Set(trades.map((t) => t.date))].sort();
  const defaultWeekStart = allDates.length ? mondayOf(allDates[allDates.length - 1]) : mondayOf(fmtLocal(new Date()));

  const [showPicker, setShowPicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(defaultWeekStart.slice(0, 7));
  const [weekStart, setWeekStart] = useState(defaultWeekStart);
  const [weekEnd, setWeekEnd] = useState(fridayOf(defaultWeekStart));

  const weekTrades = trades.filter((t) => t.date >= weekStart && t.date <= weekEnd);

  const weekLabel = fmtDay(weekStart) + " – " + fmtDay(weekEnd);

  const currentMonthKey = fmtLocal(new Date()).slice(0, 7);
  const monthTrades = trades.filter((t) => t.date.slice(0, 7) === currentMonthKey);

  return (
    <div className="px-7 pt-6 pb-10">
      <div className="mb-[18px] flex items-stretch gap-4 relative">
        <div className="flex-1 min-w-0 flex flex-col relative">
          <div className="text-[22px] font-bold">Dashboard</div>
          <div className="text-[15.5px] text-text-muted mt-0.5 mb-3">Warrior-style momentum log</div>
          <div className="flex items-center gap-2 flex-wrap mt-auto">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPicker((v) => !v)}
                className="text-[15px] px-3 py-1.5 rounded-md bg-surface-2 border border-border text-text-secondary cursor-pointer flex items-center gap-1.5"
              >
                📅 {weekLabel} ▾
              </button>
              {showPicker && (
                <DateRangePicker
                  monthKey={pickerMonth}
                  onMonthChange={setPickerMonth}
                  rangeStart={weekStart}
                  rangeEnd={weekEnd}
                  trades={trades}
                  onRangeConfirm={(start, end) => {
                    setWeekStart(start);
                    setWeekEnd(end);
                    setShowPicker(false);
                  }}
                />
              )}
            </div>
            <div className="text-[15px] px-3 py-1.5 rounded-md bg-surface-2 border border-border text-text-secondary">Cash · Schwab</div>
          </div>
        </div>
        <AccountBalanceCard trades={trades} startingBalance={startingBalance} />
      </div>

      {trades.length === 0 ? (
        <div className="border border-dashed rounded-xl px-6 py-16 text-center text-text-muted" style={{ borderColor: "var(--border-strong)" }}>
          <div className="text-[33px] mb-2.5">◇</div>
          <div className="text-[17px] font-semibold text-text-secondary mb-1">No trades logged yet</div>
          <div className="text-[15.5px] max-w-[340px] mx-auto">
            Connect your Schwab account in Settings to start seeing your KPIs, calendar, and equity curve here.
          </div>
        </div>
      ) : (
        <>
          <KpiCards trades={trades} />
          <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: "1.75fr 1fr" }}>
            <PnlCalendar trades={trades} startingBalance={startingBalance} initialMonthKey={weekStart.slice(0, 7)} />
            <RecentTrades trades={weekTrades} />
          </div>
          <DailyPnlChart trades={monthTrades} />
        </>
      )}
    </div>
  );
}
