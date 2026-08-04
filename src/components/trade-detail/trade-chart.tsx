"use client";

import { useEffect, useRef, useState } from "react";
import {
  CandlestickSeries,
  CrosshairMode,
  createChart,
  createSeriesMarkers,
  type MouseEventParams,
  type SeriesMarker,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Bar } from "@/market-data/provider";
import type { TradeExecutionRow } from "@/trades/queries";

export interface TradeChartProps {
  bars: Bar[];
  executions: TradeExecutionRow[];
}

function toUtcTimestamp(d: Date): UTCTimestamp {
  return Math.floor(d.getTime() / 1000) as UTCTimestamp;
}

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

interface Hovered {
  o: number;
  h: number;
  l: number;
  c: number;
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

export function TradeChart({ bars, executions }: TradeChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [timeframe, setTimeframe] = useState<1 | 5 | 15>(1);
  const [hovered, setHovered] = useState<Hovered | null>(null);

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

    const seriesMarkers: SeriesMarker<Time>[] = executions.map((e) => {
      const [h, m, s] = e.time.split(":").map(Number);
      const t = new Date(bars[0].time);
      t.setHours(h, m, s, 0);
      return {
        time: toUtcTimestamp(t),
        position: e.role === "entry" ? "belowBar" : "aboveBar",
        shape: e.role === "entry" ? "arrowUp" : "arrowDown",
        color: e.side === "buy" ? win : loss,
        text: `${e.role === "entry" ? "Entry" : "Exit"} ${e.price.toFixed(2)}`,
      };
    });
    createSeriesMarkers(series, seriesMarkers);

    chart.timeScale().fitContent();

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
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      chart.remove();
    };
  }, [bars, executions, timeframe]);

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
      <div ref={containerRef} className="h-[300px] w-full" />
    </div>
  );
}
