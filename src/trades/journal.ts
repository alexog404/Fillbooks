/** Standard R-multiple: realized profit per share divided by planned risk
 * per share (entry to stop). Null if a stop isn't set, or is set on the
 * wrong side of entry for the trade's direction (risk must be positive) --
 * a malformed R is worse than no R at all. */
export function computeR(side: "long" | "short", entry: number, exit: number, stop: number | null): number | null {
  if (stop == null) return null;
  const risk = side === "long" ? entry - stop : stop - entry;
  if (risk <= 0) return null;
  const profit = side === "long" ? exit - entry : entry - exit;
  return profit / risk;
}
