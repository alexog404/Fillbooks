import { fromZonedTime } from "date-fns-tz";

const MARKET_ZONE = "America/New_York";

export interface SessionWindow {
  startUtc: Date;
  endUtc: Date;
}

/**
 * The regular session (09:30-16:00 ET) bounds, in UTC, for a trade's
 * `date` (already a plain ET calendar-date string, e.g. "2026-07-31" --
 * see CLAUDE.md's timezone trap for why `trades.date` avoids `timestamptz`
 * in the first place). Used to scope both the bar fetch and the
 * price_bars cache lookup to "the trade's day."
 *
 * `fromZonedTime` reads its input Date via *local* getters, so the naive
 * Date passed to it must be built with the local-time constructor (not
 * `Date.UTC`) -- see CLAUDE.md; this sidesteps that entirely since
 * `date`'s Y/M/D components are used directly, never round-tripped
 * through a Date representing the trade's own instant.
 */
export function sessionWindowForDate(date: string): SessionWindow {
  const [year, month, day] = date.split("-").map(Number);
  const openNaive = new Date(year, month - 1, day, 9, 30, 0);
  const closeNaive = new Date(year, month - 1, day, 16, 0, 0);
  return {
    startUtc: fromZonedTime(openNaive, MARKET_ZONE),
    endUtc: fromZonedTime(closeNaive, MARKET_ZONE),
  };
}
