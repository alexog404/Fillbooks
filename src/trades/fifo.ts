export interface FifoExecutionInput {
  id: string;
  executedAt: Date;
  side: "buy" | "sell";
  qty: number;
  price: number;
  /** Total misc fees + commissions for this execution's *full* qty, as a
   * signed dollar amount (a cost is negative) -- prorated per share when an
   * execution's qty is consumed across more than one lot. Always 0 for now
   * (fee-joining isn't wired up yet), kept as a real parameter so it's a
   * one-line change to plug in later rather than a signature change. */
  fees: number;
}

export interface FifoTradeExecutionLink {
  executionId: string;
  role: "entry" | "exit";
  qtyApplied: number;
  price: number;
}

export interface FifoTrade {
  direction: "long" | "short";
  status: "open" | "closed";
  openedAt: Date;
  closedAt: Date | null;
  qty: number;
  avgEntry: number;
  avgExit: number | null;
  grossPnl: number | null;
  fees: number;
  netPnl: number | null;
  links: FifoTradeExecutionLink[];
}

// "One closed lot = one trade" (see CLAUDE.md). Each entry execution (or the
// leftover remainder of one, on a position flip) creates its own standalone
// lot with a fixed qty/price set at creation -- it never merges with another
// entry, even one for the same symbol/direction seconds later. A lot lives
// in the FIFO queue accumulating exit fills from one or more later opposite-
// side executions until its remainingQty hits zero, at which point *that
// lot* (not the overall position) closes as a trade. Money is tracked in
// integer units of $0.0001 throughout (matching the `money` column's own
// numeric(_, 4) scale -- see CLAUDE.md's integer-cents trap) and only
// converted to dollars in finalizeLot(). Whole cents aren't fine enough:
// Schwab's API reports real sub-penny fill prices (e.g. 3.5125), which
// rounding to cents would silently truncate to 3.51 and distort P&L.
interface Lot {
  direction: "long" | "short";
  openedAt: Date;
  entryQty: number;
  entryPriceUnits: number;
  feesUnits: number;
  remainingQty: number;
  exitQty: number;
  exitSumUnits: number;
  links: FifoTradeExecutionLink[];
}

const UNITS_PER_DOLLAR = 10000;

function toUnits(dollars: number): number {
  return Math.round(dollars * UNITS_PER_DOLLAR);
}

function openingSide(direction: "long" | "short"): "buy" | "sell" {
  return direction === "long" ? "buy" : "sell";
}

function directionOf(side: "buy" | "sell"): "long" | "short" {
  return side === "buy" ? "long" : "short";
}

function finalizeLot(lot: Lot, closedAt: Date | null): FifoTrade {
  const avgEntry = lot.entryPriceUnits / UNITS_PER_DOLLAR;
  const avgExit = lot.exitQty > 0 ? lot.exitSumUnits / lot.exitQty / UNITS_PER_DOLLAR : null;

  const entrySumUnits = lot.entryQty * lot.entryPriceUnits;
  const grossPnlUnits =
    lot.exitQty === lot.entryQty
      ? lot.direction === "long"
        ? lot.exitSumUnits - entrySumUnits
        : entrySumUnits - lot.exitSumUnits
      : null;
  const netPnlUnits = grossPnlUnits !== null ? grossPnlUnits + lot.feesUnits : null;

  return {
    direction: lot.direction,
    status: closedAt ? "closed" : "open",
    openedAt: lot.openedAt,
    closedAt,
    qty: lot.entryQty,
    avgEntry,
    avgExit,
    grossPnl: grossPnlUnits !== null ? grossPnlUnits / UNITS_PER_DOLLAR : null,
    fees: lot.feesUnits / UNITS_PER_DOLLAR,
    netPnl: netPnlUnits !== null ? netPnlUnits / UNITS_PER_DOLLAR : null,
    links: lot.links,
  };
}

/**
 * FIFO lot matching for one symbol's executions. A buy (or, when short, a
 * sell) pushes a new lot onto the queue. An opposite-side execution consumes
 * from the head of the queue, splitting itself across as many lots as needed
 * -- so one sell execution can close several trades at once if multiple buy
 * lots were queued ahead of it, and one lot can be closed by several separate
 * sell executions over time. When the queue empties mid-execution, the
 * remainder flips direction and opens a new lot.
 *
 * `executions` must already be in chronological order (ties broken by a
 * stable, deterministic order such as insertion/id order from the caller's
 * query) -- this function does not re-sort.
 */
export function matchFifoTrades(executions: FifoExecutionInput[]): FifoTrade[] {
  const trades: FifoTrade[] = [];
  const queue: Lot[] = [];

  function pushLot(executionId: string, executedAt: Date, side: "buy" | "sell", qty: number, priceUnits: number, feesUnits: number) {
    queue.push({
      direction: directionOf(side),
      openedAt: executedAt,
      entryQty: qty,
      entryPriceUnits: priceUnits,
      feesUnits,
      remainingQty: qty,
      exitQty: 0,
      exitSumUnits: 0,
      links: [{ executionId, role: "entry", qtyApplied: qty, price: priceUnits / UNITS_PER_DOLLAR }],
    });
  }

  for (const exec of executions) {
    const priceUnits = toUnits(exec.price);
    const direction = queue.length > 0 ? queue[0].direction : null;

    if (direction === null || exec.side === openingSide(direction)) {
      pushLot(exec.id, exec.executedAt, exec.side, exec.qty, priceUnits, toUnits(exec.fees));
      continue;
    }

    // Reducing side: consume from the head of the queue, possibly closing
    // several lots (each its own trade) with this one execution.
    let remaining = exec.qty;
    const feeUnitsPerShare = exec.qty === 0 ? 0 : toUnits(exec.fees) / exec.qty;

    while (remaining > 0 && queue.length > 0) {
      const lot = queue[0];
      const consumeQty = Math.min(lot.remainingQty, remaining);

      lot.exitQty += consumeQty;
      lot.exitSumUnits += consumeQty * priceUnits;
      lot.feesUnits += feeUnitsPerShare * consumeQty;
      lot.links.push({ executionId: exec.id, role: "exit", qtyApplied: consumeQty, price: exec.price });
      lot.remainingQty -= consumeQty;
      remaining -= consumeQty;

      if (lot.remainingQty <= 0) {
        trades.push(finalizeLot(lot, exec.executedAt));
        queue.shift();
      }
    }

    if (remaining > 0) {
      // Queue fully drained but this execution still has qty left over --
      // it flips the position and opens a new lot in the other direction.
      pushLot(exec.id, exec.executedAt, exec.side, remaining, priceUnits, feeUnitsPerShare * remaining);
    }
  }

  // Whatever lots never fully closed are open trades, oldest first.
  for (const lot of queue) {
    trades.push(finalizeLot(lot, null));
  }

  return trades;
}
