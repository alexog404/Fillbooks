import { db } from "@/db";
import { getAllTrades, getTradeById, getTradeExecutions } from "@/trades/queries";
import { TradeDetailClient } from "@/components/trade-detail/trade-detail-client";

export const dynamic = "force-dynamic";

export default async function TradeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;

  const trade = await getTradeById(db, id);
  if (!trade) {
    return (
      <div className="px-7 py-6">
        <div className="text-[19px] font-bold">Trade not found</div>
        <p className="text-text-muted text-sm mt-2">This trade may have been removed by a rebuild.</p>
      </div>
    );
  }

  const [executions, allTrades] = await Promise.all([getTradeExecutions(db, id), getAllTrades(db)]);

  const sorted = [...allTrades].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const idx = sorted.findIndex((t) => t.id === id);
  const prevId = idx > 0 ? sorted[idx - 1].id : null;
  const nextId = idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1].id : null;

  const dayTrades = sorted
    .filter((t) => t.date === trade.date)
    .map((t) => ({ id: t.id, symbol: t.symbol, time: t.time, pnl: t.pnl }));

  return (
    <TradeDetailClient
      trade={trade}
      executions={executions}
      dayTrades={dayTrades}
      prevId={prevId}
      nextId={nextId}
      from={from ?? "trades"}
    />
  );
}
