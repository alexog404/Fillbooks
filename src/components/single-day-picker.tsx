"use client";

import { buildCalendar, monthLabel, parseMonthKey, shiftMonthKey, type Trade } from "@/lib/trades";

export function SingleDayPicker({
  monthKey,
  onMonthChange,
  selectedDate,
  trades,
  onSelect,
}: {
  monthKey: string;
  onMonthChange: (key: string) => void;
  selectedDate: string;
  trades: Trade[];
  onSelect: (date: string) => void;
}) {
  const { y, m } = parseMonthKey(monthKey);
  const cal = buildCalendar(trades, y, m);

  return (
    <div className="absolute left-0 top-[34px] z-10 bg-surface border border-border rounded-[10px] p-3 shadow-[0_8px_24px_rgba(0,0,0,0.35)] w-[230px] select-none">
      <div className="text-[12.5px] text-text-muted mb-1.5">Select a day</div>
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={() => onMonthChange(shiftMonthKey(monthKey, -1))} className="w-[22px] h-[22px] rounded-md bg-surface-2 flex items-center justify-center cursor-pointer text-[14px]">‹</button>
        <div className="text-[14.5px] font-bold">{monthLabel(monthKey)}</div>
        <button type="button" onClick={() => onMonthChange(shiftMonthKey(monthKey, 1))} className="w-[22px] h-[22px] rounded-md bg-surface-2 flex items-center justify-center cursor-pointer text-[14px]">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-[12px] text-text-muted mb-[3px]">
        <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
      </div>
      {cal.weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
          {week.cells.map((cell, ci) => {
            if (!cell) return <div key={ci} />;
            const bg = cell.empty ? "var(--surface-2)" : cell.pnl > 0 ? "var(--win)" : cell.pnl < 0 ? "var(--loss)" : "var(--border-strong)";
            return (
              <div
                key={ci}
                onClick={() => onSelect(cell.date)}
                className="aspect-square rounded-[5px] flex items-center justify-center text-[12.5px] text-white cursor-pointer box-border"
                style={{ background: bg, border: cell.date === selectedDate ? "2px solid var(--primary)" : "2px solid transparent" }}
              >
                {cell.day}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
