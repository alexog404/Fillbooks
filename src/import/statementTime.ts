const STATEMENT_TIME_RE = /^(\d{1,2})\/(\d{1,2})\/(\d{2})\s+(\d{1,2}):(\d{2}):(\d{2})$/;

export interface StatementLocalTime {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/** Parses the statement's "M/D/YY H:MM:SS" format. 2-digit years are 20xx --
 * these statements don't predate that, and won't for a long while. */
export function parseStatementLocalTime(raw: string): StatementLocalTime | null {
  const match = STATEMENT_TIME_RE.exec(raw.trim());
  if (!match) return null;
  const [, m, d, yy, h, mi, s] = match;
  return { year: 2000 + Number(yy), month: Number(m), day: Number(d), hour: Number(h), minute: Number(mi), second: Number(s) };
}

/** Formats as the Y-M-D / H:M:S strings `trades`/`executions` store --
 * assumes the statement's display timezone is already Eastern (thinkorswim's
 * typical default, and what every date/time string elsewhere in this app
 * already assumes). No UTC conversion happens here at all, deliberately --
 * see CLAUDE.md's timezone trap; the safest way to avoid it is to never
 * round-trip through a Date's UTC representation in the first place. */
export function formatDateTimeStrings(t: StatementLocalTime): { date: string; time: string } {
  const date = `${t.year}-${String(t.month).padStart(2, "0")}-${String(t.day).padStart(2, "0")}`;
  const time = `${String(t.hour).padStart(2, "0")}:${String(t.minute).padStart(2, "0")}:${String(t.second).padStart(2, "0")}`;
  return { date, time };
}

/** An in-process-only Date for chronological ordering/duration math within
 * a single import run -- never stored. Safe regardless of server timezone:
 * every execution is built the same way, so any offset from true Eastern
 * cancels out in comparisons and subtractions. */
export function toSortableInstant(t: StatementLocalTime): Date {
  return new Date(t.year, t.month - 1, t.day, t.hour, t.minute, t.second);
}
