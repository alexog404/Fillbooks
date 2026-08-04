"use client";

import { useEffect, useRef, useState } from "react";
import { fromZonedTime } from "date-fns-tz";
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

const MARKET_ZONE = "America/New_York";

export interface TradeChartProps {
  bars: Bar[];
  executions: TradeExecutionRow[];
  date: string;
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

/** `date` ("Y-M-D") + `time` ("HH:MM:SS") are both plain ET strings (see
 * CLAUDE.md's timezone trap) -- built via the *local* Date constructor,
 * never `Date.UTC`, then converted assuming ET wall-clock via
 * `fromZonedTime`. Using the browser's own local timezone here (e.g. via
 * `.setHours()` on a UTC instant) silently produces the wrong instant
 * whenever the browser isn't in US Eastern time. */
function etTimeToUtc(date: string, time: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [h, m, s] = time.split(":").map(Number);
  return fromZonedTime(new Date(year, month - 1, day, h, m, s), MARKET_ZONE);
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

interface OverlayState {
  box: BoxRect | null;
  entryY: number | null;
  exitY: number | null;
}

const NO_OVERLAY: OverlayState = { box: null, entryY: null, exitY: null };

/** `timeToCoordinate` only resolves timestamps that land exactly on a
 * plotted bar -- an execution's real fill time (seconds into a bar, or a
 * thinly-traded minute Alpaca has no bar for at all) is often not one, and
 * silently returns null. `displayBars` is chronologically sorted; this
 * finds the last bar at or before `target`, falling back to the first bar
 * if the target precedes everything. */
function nearestBarTime(displayBars: Bar[], target: Date): Date {
  let result = displayBars[0].time;
  for (const b of displayBars) {
    if (b.time.getTime() <= target.getTime()) result = b.time;
    else break;
  }
  return result;
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

export function TradeChart({ bars, executions, date, entry, exit, pnl, qty, status }: TradeChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [timeframe, setTimeframe] = useState<1 | 5 | 15>(1);
  const [hovered, setHovered] = useState<Hovered | null>(null);
  const [overlay, setOverlay] = useState<OverlayState>(NO_OVERLAY);

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

    const entryRow = executions.find((e) => e.role === "entry");
    const exitRows = executions.filter((e) => e.role === "exit");
    const lastExitRow = isClosed && exitRows.length > 0 ? exitRows[exitRows.length - 1] : null;

    const entryTime = entryRow ? etTimeToUtc(date, entryRow.time) : null;
    const exitTime = lastExitRow ? etTimeToUtc(date, lastExitRow.time) : null;

    // Native axis labels are pinned to the right edge, where the current/
    // last price already lives -- the dashed lines stay (via createPriceLine),
    // but their labels are custom-rendered pinned to the *left* instead (see
    // the overlay render below) so the right edge stays readable.
    if (entryTime) {
      series.createPriceLine({ price: entry, color: win, lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: false });
    }
    if (exitTime) {
      series.createPriceLine({ price: exit, color: isWin ? win : loss, lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: false });
    }

    function renderOverlay() {
      const containerWidth = container!.clientWidth;
      const yEntry = entryTime ? series.priceToCoordinate(entry) : null;
      const yExit = exitTime ? series.priceToCoordinate(exit) : null;

      let box: BoxRect | null = null;
      if (entryTime && exitTime && yEntry != null && yExit != null) {
        const x1 = chart.timeScale().timeToCoordinate(toUtcTimestamp(nearestBarTime(displayBars, entryTime)));
        const x2 = chart.timeScale().timeToCoordinate(toUtcTimestamp(nearestBarTime(displayBars, exitTime)));
        if (x1 != null && x2 != null) {
          // Clamped to the container's own bounds -- panning the timeline
          // used to push this well past the chart card into whatever sat
          // next to it on the page.
          const left = Math.max(0, Math.min(x1, x2));
          const right = Math.min(containerWidth, Math.max(x1, x2));
          if (right > left) {
            box = { left, top: Math.min(yEntry, yExit), width: Math.max(2, right - left), height: Math.max(2, Math.abs(yExit - yEntry)) };
          }
        }
      }

      setOverlay({ box, entryY: yEntry, exitY: yExit });
    }

    // `autoSize` fits the chart to `container` via ResizeObserver, which
    // fires *after* this synchronous setup runs -- calling fitContent()
    // or reading coordinates before that first resize lands silently
    // no-ops against a zero-width chart. Worse, the right price scale's
    // autoscale recomputes off the visible range on its own paint cycle, a
    // tick behind the logical-range-change event that's supposed to
    // signal it's ready -- a single read after that event can still land
    // on stale coordinates. Polling a handful of frames is a cheap,
    // reliable way to land on the settled values without depending on
    // exactly which internal tick they land on.
    let cancelled = false;
    let framesLeft = 10;
    function pollRenderOverlay() {
      if (cancelled) return;
      renderOverlay();
      framesLeft--;
      if (framesLeft > 0) requestAnimationFrame(pollRenderOverlay);
    }
    const raf = requestAnimationFrame(() => {
      // Show the whole loaded session by default, like a real charting
      // platform -- panning/zooming to focus on the trade is left to the
      // user rather than guessed at with a padded window.
      chart.timeScale().fitContent();
      pollRenderOverlay();
    });
    chart.timeScale().subscribeVisibleLogicalRangeChange(renderOverlay);
    const resizeObserver = new ResizeObserver(renderOverlay);
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
      cancelled = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(renderOverlay);
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      chart.remove();
    };
  }, [bars, executions, date, entry, exit, isClosed, isWin, timeframe]);

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
      <div className="relative h-[300px] w-full overflow-hidden">
        <div ref={containerRef} className="absolute inset-0" />
        {overlay.box && (
          <div
            className="absolute pointer-events-none rounded-[2px]"
            style={{
              zIndex: 2,
              left: overlay.box.left,
              top: overlay.box.top,
              width: overlay.box.width,
              height: overlay.box.height,
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
        {overlay.entryY != null && (
          <div
            className="absolute pointer-events-none left-1 whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-mono font-bold"
            style={{ zIndex: 3, top: overlay.entryY, transform: "translateY(-50%)", background: "var(--win)", color: "#fff" }}
          >
            Entry {entry.toFixed(2)}
          </div>
        )}
        {overlay.exitY != null && (
          <div
            className="absolute pointer-events-none left-1 whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-mono font-bold"
            style={{ zIndex: 3, top: overlay.exitY, transform: "translateY(-50%)", background: zoneColor, color: "#fff" }}
          >
            Exit {exit.toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
}
