"use client";

import { useState } from "react";
import Link from "next/link";
import { DateRangePicker } from "@/components/date-range-picker";
import { dateShort, formatDuration, fmtDay, fmtLocal, fridayOf, mondayOf, money, pnlColorVar, type Trade } from "@/lib/trades";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function statusMeta(status: Trade["status"]) {
  if (status === "cancelled") return { label: "Cancelled", dot: "var(--loss)" };
  if (status === "closed") return { label: "Filled", dot: "var(--win)" };
  return { label: "Working", dot: "#f59e0b" };
}

const COLS = "96px 96px 64px 42px 56px 1fr 56px 90px 120px 66px 60px 30px";

export function TradesTable({ trades }: { trades: Trade[] }) {
  const allDates = [...new Set(trades.map((t) => t.date))].sort();
  const defaultStart = allDates.length ? mondayOf(allDates[allDates.length - 1]) : mondayOf(fmtLocal(new Date()));

  const [showPicker, setShowPicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(defaultStart.slice(0, 7));
  const [rangeStart, setRangeStart] = useState(defaultStart);
  const [rangeEnd, setRangeEnd] = useState(fridayOf(defaultStart));
  const [sortKey, setSortKey] = useState<"date" | "pnl">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const rangeLabel = fmtDay(rangeStart) + " – " + fmtDay(rangeEnd);

  let filtered = trades.filter((t) => t.date >= rangeStart && t.date <= rangeEnd);
  filtered = [...filtered].sort((a, b) => {
    const av = sortKey === "pnl" ? a.pnl : a.date + a.time;
    const bv = sortKey === "pnl" ? b.pnl : b.date + b.time;
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDir === "asc" ? cmp : -cmp;
  });

  const spanDays = (new Date(rangeEnd + "T00:00:00").getTime() - new Date(rangeStart + "T00:00:00").getTime()) / 86400000 + 1;
  const groupKeyFn = spanDays <= 1 ? null : spanDays <= 7 ? (d: string) => d : spanDays <= 31 ? (d: string) => mondayOf(d) : (d: string) => d.slice(0, 7);
  const groupLabelFn =
    spanDays <= 7
      ? (k: string) => dateShort(k)
      : spanDays <= 31
        ? (k: string) => "Week of " + dateShort(k)
        : (k: string) => {
            const [y, m] = k.split("-");
            return MONTH_NAMES[Number(m) - 1] + " " + y;
          };

  type Group = { key: string; label: string; total: number; rows: Trade[] };
  let groups: Group[] | null = null;
  if (groupKeyFn) {
    const order: string[] = [];
    const map: Record<string, Trade[]> = {};
    filtered.forEach((t) => {
      const k = groupKeyFn(t.date);
      if (!map[k]) {
        map[k] = [];
        order.push(k);
      }
      map[k].push(t);
    });
    groups = order.map((k) => ({ key: k, label: groupLabelFn(k), total: map[k].reduce((s, t) => s + t.pnl, 0), rows: map[k] }));
  }

  function toggleSort(key: "date" | "pnl") {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function Row({ t }: { t: Trade }) {
    const meta = statusMeta(t.status);
    return (
      <Link
        href={`/trades/${t.id}?from=trades`}
        style={{ gridTemplateColumns: COLS }}
        className="grid gap-2 px-4 py-2 text-[15px] border-t border-border items-center hover:bg-surface-hover"
      >
        <div className="text-text-secondary">{dateShort(t.date)}</div>
        <div className="text-text-muted font-mono">{t.time}</div>
        <div className="font-bold font-mono">{t.symbol}</div>
        <div className="font-semibold text-[13.5px]" style={{ color: t.side === "long" ? "var(--win)" : "var(--loss)" }}>
          {t.side === "long" ? "L" : "S"}
        </div>
        <div className="text-right font-mono text-text-secondary">{t.qty}</div>
        <div className="text-right font-mono text-text-secondary">{t.entry.toFixed(2)}</div>
        <div className="text-right font-mono text-text-secondary">{t.exit.toFixed(2)}</div>
        <div className="text-right font-bold font-mono" style={{ color: pnlColorVar(t.pnl) }}>{money(t.pnl, true)}</div>
        <div className="text-text-muted font-mono">{formatDuration(t.durationSeconds)}</div>
        <div className="flex items-center gap-1.5 text-[14px] text-text-secondary">
          <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: meta.dot }} />
          {meta.label}
        </div>
        <div style={{ color: t.hasNote ? "var(--primary)" : "var(--text-muted)" }}>{t.hasNote ? "●" : "○"}</div>
        <div className="text-text-muted">›</div>
      </Link>
    );
  }

  return (
    <div className="px-7 pt-6 pb-10">
      <div className="flex items-center justify-between mb-3.5">
        <div className="text-[22px] font-bold">Trades</div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPicker((v) => !v)}
              className="text-[15px] px-3 py-1.5 rounded-md bg-surface-2 border border-border text-text-secondary cursor-pointer flex items-center gap-1.5"
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
                  setShowPicker(false);
                }}
              />
            )}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed rounded-xl px-6 py-14 text-center text-text-muted" style={{ borderColor: "var(--border-strong)" }}>
          <div className="text-[27px] mb-2.5">▤</div>
          <div className="text-[17px] font-semibold text-text-secondary">No trades match these filters</div>
          <div className="text-[15px] mt-1">Try widening the date range.</div>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-[10px] overflow-x-auto">
          <div className="min-w-[980px]">
            <div style={{ gridTemplateColumns: COLS }} className="grid gap-2 px-4 py-2 text-[13.2px] text-text-muted uppercase tracking-[0.03em] bg-surface-2">
              <div onClick={() => toggleSort("date")} className="cursor-pointer">
                Date{sortKey === "date" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
              </div>
              <div>Time</div>
              <div>Sym</div>
              <div>Side</div>
              <div className="text-right">Qty</div>
              <div className="text-right">Entry</div>
              <div className="text-right">Exit</div>
              <div onClick={() => toggleSort("pnl")} className="text-right cursor-pointer">
                Net P&L{sortKey === "pnl" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
              </div>
              <div>Duration</div>
              <div>Status</div>
              <div>Note</div>
              <div />
            </div>

            {groups
              ? groups.map((g) => (
                  <div key={g.key}>
                    <div className="flex items-center justify-between px-4 py-2 bg-surface-2 border-t border-border">
                      <div className="text-[14.5px] font-bold text-text-secondary">{g.label}</div>
                      <div className="text-[14.5px] font-bold font-mono" style={{ color: pnlColorVar(g.total) }}>{money(g.total, true)}</div>
                    </div>
                    {g.rows.map((t) => (
                      <Row key={t.id} t={t} />
                    ))}
                  </div>
                ))
              : filtered.map((t) => <Row key={t.id} t={t} />)}
          </div>
        </div>
      )}
    </div>
  );
}
