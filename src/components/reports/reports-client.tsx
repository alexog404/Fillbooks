"use client";

import { useState } from "react";
import { DateRangePicker } from "@/components/date-range-picker";
import {
  averagePriceDistribution,
  computeStatRows,
  winRateByDayOfWeek,
  winRateByTimeOfDay,
} from "@/lib/reports";
import { fmtDay, fmtLocal, fridayOf, mondayOf, type Trade } from "@/lib/trades";

function BarRow({ label, pct, pctText, color }: { label: string; pct: number; pctText: string; color: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-2.5">
      <div className="w-[110px] text-[14.5px] text-text-secondary">{label}</div>
      <div className="flex-1 h-2.5 rounded-full bg-surface-2 overflow-hidden">
        <div className="h-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="w-11 text-right text-[14px] font-mono text-text-secondary">{pctText}</div>
    </div>
  );
}

export function ReportsClient({ trades }: { trades: Trade[] }) {
  const allDates = [...new Set(trades.map((t) => t.date))].sort();
  const defaultStart = allDates.length ? mondayOf(allDates[allDates.length - 1]) : mondayOf(fmtLocal(new Date()));

  const [showPicker, setShowPicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(defaultStart.slice(0, 7));
  const [rangeStart, setRangeStart] = useState(defaultStart);
  const [rangeEnd, setRangeEnd] = useState(fridayOf(defaultStart));
  const [isLifetime, setIsLifetime] = useState(true);

  const rangeLabel = fmtDay(rangeStart) + " – " + fmtDay(rangeEnd);
  const reportsTrades = isLifetime ? trades : trades.filter((t) => t.date >= rangeStart && t.date <= rangeEnd);

  if (trades.length === 0) {
    return (
      <div className="px-7 pt-6 pb-10">
        <Header />
        <div className="border border-dashed rounded-xl px-6 py-14 text-center text-text-muted" style={{ borderColor: "var(--border-strong)" }}>
          <div className="text-[27px] mb-2.5">▤</div>
          <div className="text-[17px] font-semibold text-text-secondary">Not enough trades yet</div>
          <div className="text-[15px] mt-1">Insights need a larger sample size to be meaningful — log more trades to unlock this view.</div>
        </div>
      </div>
    );
  }

  const statRows = computeStatRows(reportsTrades);
  const byTime = winRateByTimeOfDay(reportsTrades);
  const byDow = winRateByDayOfWeek(reportsTrades);
  const byPrice = averagePriceDistribution(reportsTrades);

  return (
    <div className="px-7 pt-6 pb-10">
      <div className="flex items-center justify-between mb-4">
        <Header />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLifetime(true)}
            className="text-[15px] px-3 py-1.5 rounded-md border cursor-pointer font-semibold"
            style={
              isLifetime
                ? { background: "var(--accent-soft)", borderColor: "var(--primary)", color: "var(--primary)" }
                : { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-secondary)" }
            }
          >
            Lifetime
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPicker((v) => !v)}
              className="text-[15px] px-3 py-1.5 rounded-md border cursor-pointer flex items-center gap-1.5"
              style={
                isLifetime
                  ? { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-secondary)" }
                  : { background: "var(--accent-soft)", borderColor: "var(--primary)", color: "var(--primary)" }
              }
            >
              📅 {rangeLabel} ▾
            </button>
            {showPicker && (
              <DateRangePicker
                monthKey={pickerMonth}
                onMonthChange={setPickerMonth}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                trades={trades}
                align="right"
                onRangeConfirm={(start, end) => {
                  setRangeStart(start);
                  setRangeEnd(end);
                  setIsLifetime(false);
                  setShowPicker(false);
                }}
              />
            )}
          </div>
        </div>
      </div>

      {reportsTrades.length === 0 ? (
        <div className="border border-dashed rounded-xl px-6 py-14 text-center text-text-muted" style={{ borderColor: "var(--border-strong)" }}>
          <div className="text-[27px] mb-2.5">▤</div>
          <div className="text-[17px] font-semibold text-text-secondary">No trades in this range</div>
        </div>
      ) : (
        <>
          <div className="bg-surface border border-border rounded-[10px] mb-3.5 overflow-hidden">
            <div className="text-[18px] font-bold px-4.5 py-3.5">Stats</div>
            {statRows.map((row, i) => (
              <div key={i} className="grid grid-cols-3 border-t border-border">
                {row.map((cell, j) => (
                  <div key={j} className="flex items-center justify-between gap-2.5 px-4.5 py-2.5 border-l border-border first:border-l-0">
                    <div className="text-[15.5px] text-text-muted">{cell.label}</div>
                    <div className="text-[16.5px] font-bold font-mono whitespace-nowrap" style={cell.color ? { color: cell.color } : undefined}>{cell.value}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3.5 mb-3.5">
            <div className="bg-surface border border-border rounded-[10px] p-4">
              <div className="text-[15.5px] font-bold mb-3">Win Rate by Time of Day</div>
              {byTime.map((b) => (
                <BarRow key={b.label} label={b.label} pct={b.pct} pctText={b.pct.toFixed(0) + "%"} color={b.color} />
              ))}
            </div>
            <div className="bg-surface border border-border rounded-[10px] p-4">
              <div className="text-[15.5px] font-bold mb-3">Win Rate by Day of Week</div>
              {byDow.map((b) => (
                <BarRow key={b.label} label={b.label} pct={b.pct} pctText={b.pct.toFixed(0) + "%"} color={b.color} />
              ))}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-[10px] p-4">
            <div className="text-[15.5px] font-bold mb-3">Average Price of Stocks Traded</div>
            {byPrice.map((b) => (
              <div key={b.label} className="flex items-center gap-2.5 mb-2.5">
                <div className="w-[60px] text-[14.5px] text-text-secondary font-mono font-bold">{b.label}</div>
                <div className="flex-1 h-2.5 rounded-full bg-surface-2 overflow-hidden">
                  <div className="h-full" style={{ width: `${b.pct}%`, background: "var(--primary)" }} />
                </div>
                <div className="w-[60px] text-right text-[14px] font-mono text-text-secondary">{b.shares.toLocaleString()} sh</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Header() {
  return (
    <div>
      <div className="text-[22px] font-bold">Reports &amp; Insights</div>
      <div className="text-[15.5px] text-text-muted mt-0.5">Where the edge shows up — and where it leaks</div>
    </div>
  );
}
