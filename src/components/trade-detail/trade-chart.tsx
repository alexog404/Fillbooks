"use client";

import { useEffect, useRef, useState } from "react";
import {
  CandlestickSeries,
  CrosshairMode,
  LineStyle,
  createChart,
  type MouseEventParams,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Bar } from "@/market-data/provider";
import type { TradeExecutionRow } from "@/trades/queries";
import { money } from "@/lib/trades";

export interface TradeChartProps {
  bars: Bar[];
  executions: TradeExecutionRow[];
  entry: number;
  exit: number;
  pnl: number;
  qty: number;
  status: "closed" | "working" | "cancelled";
}

function toUtcTimestamp(d: Date): UTCTimestamp {
  return Math.floor(d.getTime() / 1000) as UTCTimestamp;
}

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** `time` ("HH:MM:SS") anchored onto the calendar day of `dayBase`, same
 * convention as the old marker code -- executions only ever carry a plain
 * time-of-day string, never their own date. */
function timeOnDay(dayBase: Date, time: string): Date {
  const [h, m, s] = time.split(":").map(Number);
  const d = new Date(dayBase);
  d.setHours(h, m, s, 0);
  return d;
}

interface Hovered {
  o: number;
  h: number;
  l: number;
  c: number;
}

interface BoxRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Client-side 5m/15m aggregation from the cached 1m bars -- no extra
 * cache entry or provider call for the timeframe toggle. */
function aggregate(bars: Bar[], minutes: number): Bar[] {
  if (minutes === 1) return bars;
  const bucketMs = minutes * 60_000;
  const buckets = new Map<number, Bar[]>();
  for (const bar of bars) {
    const bucketStart = Math.floor(bar.time.getTime() / bucketMs) * bucketMs;
    const list = buckets.get(bucketStart);
    if (list) list.push(bar);
    else buckets.set(bucketStart, [bar]);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([bucketStart, group]) => ({
      time: new Date(bucketStart),
      open: group[0].open,
      high: Math.max(...group.map((b) => b.high)),
      low: Math.min(...group.map((b) => b.low)),
      close: group[group.length - 1].close,
      volume: group.reduce((s, b) => s + b.volume, 0),
    }));
}

export function TradeChart({ bars, executions, entry, exit, pnl, qty, status }: TradeChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [timeframe, setTimeframe] = useState<1 | 5 | 15>(1);
  const [hovered, setHovered] = useState<Hovered | null>(null);
  const [box, setBox] = useState<BoxRect | null>(null);

  const isClosed = status === "closed";
  const isWin = pnl >= 0;
  const zoneColor = isWin ? "var(--win)" : "var(--loss)";

  useEffect(() => {
    const container = containerRef.current;
    if (!container || bars.length === 0) return;

    const win = cssVar("--win");
    const loss = cssVar("--loss");
    const border = cssVar("--border");
    const textMuted = cssVar("--text-muted");

    const chart = createChart(container, {
      autoSize: true,
      layout: { background: { color: "transparent" }, textColor: textMuted },
      grid: { vertLines: { color: border }, horzLines: { color: border } },
      rightPriceScale: { borderColor: border },
      timeScale: { borderColor: border, timeVisible: true, secondsVisible: false },
      crosshair: { mode: CrosshairMode.Normal },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: win,
      downColor: loss,
      borderUpColor: win,
      borderDownColor: loss,
      wickUpColor: win,
      wickDownColor: loss,
    });

    const displayBars = aggregate(bars, timeframe);
    series.setData(
      displayBars.map((b) => ({ time: toUtcTimestamp(b.time), open: b.open, high: b.high, low: b.low, close: b.close })),
    );

    const dayBase = bars[0].time;
    const entryRow = executions.find((e) => e.role === "entry");
    const exitRows = executions.filter((e) => e.role === "exit");
    const lastExitRow = isClosed && exitRows.length > 0 ? exitRows[exitRows.length - 1] : null;

    const entryTime = entryRow ? timeOnDay(dayBase, entryRow.time) : null;
    const exitTime = lastExitRow ? timeOnDay(dayBase, lastExitRow.time) : null;

    if (entryTime) {
      series.createPriceLine({ price: entry, color: win, lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: "Entry" });
    }
    if (exitTime) {
      series.createPriceLine({ price: exit, color: isWin ? win : loss, lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: "Exit" });
    }

    // Default to a window padded around the trade itself, not the whole
    // session -- fitContent() on a full 390-bar day made short trades a
    // sliver a few pixels wide, with markers overlapping and unreadable.
    const barTimes = displayBars.map((b) => b.time.getTime());
    const dataStart = barTimes[0];
    const dataEnd = barTimes[barTimes.length - 1];
    const windowStart = entryTime ? entryTime.getTime() : dataStart;
    const windowEnd = exitTime ? exitTime.getTime() : entryTime ? entryTime.getTime() : dataEnd;
    const durationMin = Math.max(1, (windowEnd - windowStart) / 60_000);
    const padMs = Math.min(60, Math.max(8, Math.round(durationMin * 0.7))) * 60_000;
    const from = Math.max(dataStart, windowStart - padMs);
    const to = Math.min(dataEnd, windowEnd + padMs);
    if (from < to) {
      chart.timeScale().setVisibleRange({ from: toUtcTimestamp(new Date(from)), to: toUtcTimestamp(new Date(to)) });
    } else {
      chart.timeScale().fitContent();
    }

    function renderBox() {
      if (!entryTime || !exitTime) {
        setBox(null);
        return;
      }
      const x1 = chart.timeScale().timeToCoordinate(toUtcTimestamp(entryTime));
      const x2 = chart.timeScale().timeToCoordinate(toUtcTimestamp(exitTime));
      const yEntry = series.priceToCoordinate(entry);
      const yExit = series.priceToCoordinate(exit);
      if (x1 == null || x2 == null || yEntry == null || yExit == null) {
        setBox(null);
        return;
      }
      setBox({
        left: Math.min(x1, x2),
        top: Math.min(yEntry, yExit),
        width: Math.max(2, Math.abs(x2 - x1)),
        height: Math.max(2, Math.abs(yExit - yEntry)),
      });
    }

    renderBox();
    chart.timeScale().subscribeVisibleLogicalRangeChange(renderBox);
    const resizeObserver = new ResizeObserver(renderBox);
    resizeObserver.observe(container);

    function handleCrosshairMove(param: MouseEventParams) {
      const point = param.seriesData.get(series);
      if (!point || !("open" in point)) {
        setHovered(null);
        return;
      }
      setHovered({ o: point.open, h: point.high, l: point.low, c: point.close });
    }
    chart.subscribeCrosshairMove(handleCrosshairMove);

    return () => {
      resizeObserver.disconnect();
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(renderBox);
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      chart.remove();
    };
  }, [bars, executions, entry, exit, isClosed, isWin, timeframe]);

  if (bars.length === 0) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center gap-1.5 rounded-[10px] border border-border bg-surface text-center px-6">
        <div className="text-[15px] font-semibold text-text-secondary">Chart data unavailable</div>
        <div className="text-[14.5px] text-text-muted max-w-sm">
          This trade is outside Alpaca&apos;s free-tier history window, or the symbol has no data on the IEX feed. The rest of this page still reflects the trade accurately.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[10px] border border-border bg-surface p-3.5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <span className="text-[16px] font-bold">Session chart</span>
          <div className="flex gap-0.5 rounded-lg border border-border p-0.5">
            {([1, 5, 15] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className="rounded-md px-2 py-1 text-[14px] font-semibold cursor-pointer"
                style={{ background: timeframe === tf ? "var(--accent-soft)" : "transparent", color: timeframe === tf ? "var(--primary)" : "var(--text-muted)" }}
              >
                {tf}m
              </button>
            ))}
          </div>
        </div>
        {hovered && (
          <div className="flex items-center gap-2.5 text-[14px] font-mono text-text-secondary">
            <span>O <span className="text-foreground">{hovered.o.toFixed(2)}</span></span>
            <span>H <span className="text-foreground">{hovered.h.toFixed(2)}</span></span>
            <span>L <span className="text-foreground">{hovered.l.toFixed(2)}</span></span>
            <span>C <span className="text-foreground">{hovered.c.toFixed(2)}</span></span>
          </div>
        )}
      </div>
      <div className="relative h-[300px] w-full">
        <div ref={containerRef} className="absolute inset-0" />
        {box && (
          <div
            className="absolute pointer-events-none rounded-[2px]"
            style={{
              left: box.left,
              top: box.top,
              width: box.width,
              height: box.height,
              background: `color-mix(in srgb, ${zoneColor} 16%, transparent)`,
              border: `1px solid ${zoneColor}`,
            }}
          >
            <div
              className="absolute -top-[23px] left-1 whitespace-nowrap rounded px-1.5 py-0.5 text-[11.5px] font-mono font-semibold"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: zoneColor }}
            >
              {money(pnl, true)} · {qty} sh
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
