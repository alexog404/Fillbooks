"use client";

import { useState } from "react";
import { buildCalendar, monthLabel, parseMonthKey, shiftMonthKey, type Trade } from "@/lib/trades";

export function DateRangePicker({
  monthKey,
  onMonthChange,
  rangeStart,
  rangeEnd,
  onRangeConfirm,
  trades,
  align = "left",
}: {
  monthKey: string;
  onMonthChange: (key: string) => void;
  rangeStart: string;
  rangeEnd: string;
  onRangeConfirm: (start: string, end: string) => void;
  trades: Trade[];
  align?: "left" | "right";
}) {
  const [anchor, setAnchor] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  const { y, m } = parseMonthKey(monthKey);
  const cal = buildCalendar(trades, y, m);

  const hover = hoverDate || anchor;
  const previewStart = anchor ? (hover! < anchor ? hover! : anchor) : rangeStart;
  const previewEnd = anchor ? (hover! < anchor ? anchor : hover!) : rangeEnd;

  function handleClick(date: string) {
    if (!anchor) {
      setAnchor(date);
      setHoverDate(date);
    } else {
      const start = anchor < date ? anchor : date;
      const end = anchor < date ? date : anchor;
      setAnchor(null);
      setHoverDate(null);
      onRangeConfirm(start, end);
    }
  }

  return (
    <div
      className="absolute top-9 z-10 bg-surface border border-border rounded-[10px] p-3 shadow-[0_8px_24px_rgba(0,0,0,0.35)] w-[230px] select-none"
      style={{ [align === "left" ? "left" : "right"]: 0 }}
    >
      <div className="text-[12.5px] text-text-muted mb-1.5">Click a day, then another to set a range</div>
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => onMonthChange(shiftMonthKey(monthKey, -1))}
          className="w-[22px] h-[22px] rounded-md bg-surface-2 flex items-center justify-center cursor-pointer text-[14px]"
        >
          ‹
        </button>
        <div className="text-[14.5px] font-bold">{monthLabel(monthKey)}</div>
        <button
          type="button"
          onClick={() => onMonthChange(shiftMonthKey(monthKey, 1))}
          className="w-[22px] h-[22px] rounded-md bg-surface-2 flex items-center justify-center cursor-pointer text-[14px]"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-[12px] text-text-muted mb-[3px]">
        <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
      </div>
      {cal.weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
          {week.cells.map((cell, ci) => {
            if (!cell) return <div key={ci} />;
            const inRange = cell.date >= previewStart && cell.date <= previewEnd;
            const bg = cell.empty ? "var(--surface-2)" : cell.pnl > 0 ? "var(--win)" : cell.pnl < 0 ? "var(--loss)" : "var(--border-strong)";
            return (
              <div
                key={ci}
                onClick={() => handleClick(cell.date)}
                onMouseEnter={() => anchor && setHoverDate(cell.date)}
                className="aspect-square rounded-[5px] flex items-center justify-center text-[12.5px] text-white cursor-pointer box-border"
                style={{ background: bg, border: inRange ? "2px solid var(--primary)" : "2px solid transparent" }}
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
