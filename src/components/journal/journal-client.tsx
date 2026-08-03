"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { SingleDayPicker } from "@/components/single-day-picker";
import { updateDailyNote } from "@/journal/actions";
import { computeKpis, dateShort, fmtLocal, money, pnlColorVar, type Trade } from "@/lib/trades";

export function JournalClient({ trades, notesByDate }: { trades: Trade[]; notesByDate: Record<string, string> }) {
  const allDates = [...new Set(trades.map((t) => t.date))].sort();
  const defaultDate = allDates.length ? allDates[allDates.length - 1] : fmtLocal(new Date());

  const [date, setDate] = useState(defaultDate);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(defaultDate.slice(0, 7));
  const [noteDraft, setNoteDraft] = useState(notesByDate[defaultDate] ?? "");
  const [noteSaved, setNoteSaved] = useState(true);
  const [isPending, startTransition] = useTransition();

  function goToDate(next: string) {
    setDate(next);
    setNoteDraft(notesByDate[next] ?? "");
    setNoteSaved(true);
    setShowPicker(false);
  }

  function shiftDay(delta: number) {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + delta);
    goToDate(fmtLocal(d));
  }

  function saveNote() {
    startTransition(() => {
      updateDailyNote(date, noteDraft);
    });
    setNoteSaved(true);
  }

  const dayTrades = trades.filter((t) => t.date === date);
  const kpis = computeKpis(dayTrades);

  return (
    <div className="px-7 pt-6 pb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <button type="button" onClick={() => shiftDay(-1)} className="w-7 h-7 rounded-md bg-surface-2 border border-border flex items-center justify-center cursor-pointer">‹</button>
          <div className="relative">
            <button type="button" onClick={() => setShowPicker((v) => !v)} className="text-base font-bold px-2 py-1 rounded-md cursor-pointer">
              {dateShort(date)}
            </button>
            {showPicker && (
              <SingleDayPicker monthKey={pickerMonth} onMonthChange={setPickerMonth} selectedDate={date} trades={trades} onSelect={goToDate} />
            )}
          </div>
          <button type="button" onClick={() => shiftDay(1)} className="w-7 h-7 rounded-md bg-surface-2 border border-border flex items-center justify-center cursor-pointer">›</button>
        </div>
      </div>

      {dayTrades.length === 0 ? (
        <div className="border border-dashed rounded-xl px-6 py-14 text-center text-text-muted mb-3.5" style={{ borderColor: "var(--border-strong)" }}>
          <div className="text-2xl mb-2.5">✎</div>
          <div className="text-sm font-semibold text-text-secondary">No trades this day</div>
          <div className="text-xs mt-1">Nothing was logged on {dateShort(date)}. Jump to another day with a trade to journal.</div>
        </div>
      ) : (
        <>
          <div className="bg-surface border border-border rounded-[10px] px-4.5 py-3.5 mb-3.5 flex items-center gap-7">
            <div>
              <div className="text-[10.5px] text-text-muted uppercase">Day Net P&L</div>
              <div className="text-xl font-extrabold font-mono mt-0.5" style={{ color: pnlColorVar(kpis.netPnl) }}>{money(kpis.netPnl, true)}</div>
            </div>
            <div>
              <div className="text-[10.5px] text-text-muted uppercase">Trades</div>
              <div className="text-xl font-extrabold font-mono mt-0.5">{kpis.total}</div>
            </div>
            <div>
              <div className="text-[10.5px] text-text-muted uppercase">Win Rate</div>
              <div className="text-xl font-extrabold font-mono mt-0.5">{kpis.winRate.toFixed(0)}%</div>
            </div>
          </div>

          <div className="mb-3.5">
            <div className="text-[11.5px] text-text-muted mb-2">Trades — click to open</div>
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {dayTrades.map((t) => (
                <Link key={t.id} href={`/trades/${t.id}?from=journal`} className="flex-none min-w-[150px] bg-surface border border-border rounded-lg px-3 py-2.5 hover:border-primary">
                  <div className="flex justify-between items-center">
                    <div className="font-bold font-mono">{t.symbol}</div>
                  </div>
                  <div className="text-[15px] font-bold font-mono mt-1" style={{ color: pnlColorVar(t.pnl) }}>{money(t.pnl, true)}</div>
                  <div className="text-[10.5px] text-text-muted mt-0.5">{t.time}</div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="bg-surface border border-border rounded-[10px] p-4">
        <div className="text-[16px] font-bold mb-2.5">Notes for {dateShort(date)}</div>
        <textarea
          value={noteDraft}
          onChange={(e) => {
            setNoteDraft(e.target.value);
            setNoteSaved(false);
          }}
          placeholder="Pre-market plan, how the day went, what to improve tomorrow..."
          className="w-full min-h-[140px] bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-[13px] leading-relaxed resize-y"
        />
        <div className="flex items-center justify-between mt-2">
          <div className="text-[11px] text-text-muted">{noteSaved ? "Saved" : "Unsaved changes"}</div>
          <button type="button" onClick={saveNote} disabled={isPending || noteSaved} className="text-[11px] px-3 py-1.5 rounded-md bg-primary text-white font-bold cursor-pointer disabled:opacity-40">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
