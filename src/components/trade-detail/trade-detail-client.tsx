"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { dateShort, money, pnlColorVar, type Trade } from "@/lib/trades";
import type { TradeExecutionRow } from "@/trades/queries";
import type { Bar } from "@/market-data/provider";
import { updateTradeJournal } from "@/trades/actions";
import { ChipsEditor } from "./chips-editor";
import { TradeChart } from "./trade-chart";

const FROM_LABELS: Record<string, string> = { dashboard: "Dashboard", trades: "Trades", journal: "Daily Journal" };

export function TradeDetailClient({
  trade,
  executions,
  bars,
  dayTrades,
  prevId,
  nextId,
  from,
}: {
  trade: Trade;
  executions: TradeExecutionRow[];
  bars: Bar[];
  dayTrades: { id: string; symbol: string; time: string; pnl: number }[];
  prevId: string | null;
  nextId: string | null;
  from: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [notesDraft, setNotesDraft] = useState(trade.notes ?? "");
  const [notesSaved, setNotesSaved] = useState(true);
  const [tab, setTab] = useState<"notes" | "executions">("notes");

  function saveField(updates: Parameters<typeof updateTradeJournal>[1]) {
    startTransition(() => {
      updateTradeJournal(trade.id, updates);
    });
  }

  function saveNotes() {
    saveField({ notes: notesDraft });
    setNotesSaved(true);
  }

  const fromLabel = FROM_LABELS[from] ?? "Dashboard";

  return (
    <div className="px-7 pt-5 pb-10">
      {dayTrades.length > 1 && (
        <div className="mb-3">
          <div className="text-[14px] text-text-muted mb-2">Other trades that day</div>
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {dayTrades.map((dt) => (
              <Link
                key={dt.id}
                href={`/trades/${dt.id}?from=${from}`}
                className="flex-none min-w-[130px] bg-surface border rounded-lg px-3 py-2.5"
                style={{ borderColor: dt.id === trade.id ? "var(--primary)" : "var(--border)" }}
              >
                <div className="flex justify-between items-center">
                  <div className="font-extrabold font-mono text-[17px]">{dt.symbol}</div>
                  <div className="text-[13.5px] text-text-muted">{dt.time}</div>
                </div>
                <div className="text-[18px] font-bold font-mono mt-1" style={{ color: pnlColorVar(dt.pnl) }}>{money(dt.pnl, true)}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2.5">
        <div className="flex items-center gap-2.5">
          <Link href={from === "journal" ? "/journal" : from === "trades" ? "/trades" : "/"} className="text-[15px] text-text-muted">
            ← {fromLabel}
          </Link>
          <div className="w-px h-3.5 bg-border" />
          <div className="text-[19px] font-bold font-mono">{trade.symbol}</div>
          <div className="text-[15px] text-text-muted">{dateShort(trade.date)} · {trade.time} ET</div>
          <span
            className="text-[14px] font-bold px-2.5 py-1 rounded-md"
            style={{ background: trade.side === "long" ? "var(--win-soft)" : "var(--loss-soft)", color: trade.side === "long" ? "var(--win)" : "var(--loss)" }}
          >
            {trade.side.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {prevId ? (
            <Link href={`/trades/${prevId}?from=${from}`} className="w-[30px] h-[30px] rounded-lg bg-surface-2 border border-border flex items-center justify-center">‹</Link>
          ) : (
            <div className="w-[30px] h-[30px] rounded-lg bg-surface-2 border border-border flex items-center justify-center opacity-30">‹</div>
          )}
          {nextId ? (
            <Link href={`/trades/${nextId}?from=${from}`} className="w-[30px] h-[30px] rounded-lg bg-surface-2 border border-border flex items-center justify-center">›</Link>
          ) : (
            <div className="w-[30px] h-[30px] rounded-lg bg-surface-2 border border-border flex items-center justify-center opacity-30">›</div>
          )}
        </div>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "260px minmax(0,1fr)" }}>
        <div className="flex flex-col gap-3 min-w-0">
          <div className="bg-surface border border-border rounded-[10px] p-4">
            <div className="text-[14px] text-text-muted uppercase tracking-[0.04em]">Net P&L</div>
            <div className="text-[29px] font-extrabold font-mono mt-1" style={{ color: pnlColorVar(trade.pnl) }}>{money(trade.pnl, true)}</div>
            <div className="grid grid-cols-2 gap-2.5 mt-3.5 text-[15px]">
              <div>
                <div className="text-text-muted text-[13.5px]">Shares</div>
                <div className="font-mono font-semibold mt-0.5">{trade.qty}</div>
              </div>
              <div>
                <div className="text-text-muted text-[13.5px]">Status</div>
                <div className="font-mono font-semibold mt-0.5 capitalize">{trade.status}</div>
              </div>
              <div>
                <div className="text-text-muted text-[13.5px]">Rating</div>
                <div className="mt-0.5 flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      onClick={() => saveField({ rating: trade.rating === n ? null : n })}
                      className="cursor-pointer"
                      style={{ color: (trade.rating ?? 0) >= n ? "var(--primary)" : "var(--text-muted)" }}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-text-muted text-[13.5px]">Duration</div>
                <div className="font-mono font-semibold mt-0.5">{trade.durationSeconds != null ? Math.round(trade.durationSeconds / 60) + "m" : "—"}</div>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-[10px] p-4">
            <ChipsEditor label="Mistakes" color="#eab308" chips={trade.mistakes} onChange={(next) => saveField({ mistakes: next })} />
            <ChipsEditor label="Habits" color="var(--primary)" chips={trade.habits} onChange={(next) => saveField({ habits: next })} />
          </div>
        </div>

        <div className="flex flex-col gap-3 min-w-0">
          <TradeChart bars={bars} executions={executions} />

          <div className="bg-surface border border-border rounded-[10px]">
            <div className="flex gap-1 px-3.5 pt-2.5 border-b border-border">
              {(["notes", "executions"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className="text-[15.5px] font-semibold px-3 py-2 cursor-pointer capitalize border-b-2"
                  style={{ color: tab === t ? "var(--foreground)" : "var(--text-muted)", borderColor: tab === t ? "var(--primary)" : "transparent" }}
                >
                  {t}
                </button>
              ))}
            </div>

            {tab === "notes" && (
              <div className="p-4">
                <textarea
                  value={notesDraft}
                  onChange={(e) => {
                    setNotesDraft(e.target.value);
                    setNotesSaved(false);
                  }}
                  placeholder="What was the plan? What actually happened?"
                  className="w-full min-h-[110px] bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-[16px] leading-relaxed resize-y"
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="text-[14px] text-text-muted">{notesSaved ? "Saved" : "Unsaved changes"}</div>
                  <button type="button" onClick={saveNotes} disabled={isPending || notesSaved} className="text-[14px] px-3 py-1.5 rounded-md bg-primary text-white font-bold cursor-pointer disabled:opacity-40">
                    Save
                  </button>
                </div>
              </div>
            )}

            {tab === "executions" && (
              <div className="px-4 py-2">
                <div className="grid grid-cols-[100px_80px_80px_1fr] px-1 py-2 text-[13.5px] text-text-muted uppercase">
                  <div>Time</div>
                  <div className="text-right">Price</div>
                  <div className="text-right">Qty</div>
                  <div className="text-right">Side</div>
                </div>
                {executions.map((ex, i) => (
                  <div key={i} className="grid grid-cols-[100px_80px_80px_1fr] px-1 py-2 text-[15.5px] border-t border-border">
                    <div className="font-mono text-text-secondary">{ex.time}</div>
                    <div className="text-right font-mono">{ex.price.toFixed(2)}</div>
                    <div className="text-right font-mono">{ex.qty}</div>
                    <div className="text-right font-semibold text-[14px]" style={{ color: ex.role === "entry" ? "var(--win)" : "var(--loss)" }}>
                      {ex.side.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
