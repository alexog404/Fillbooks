import { db } from "@/db";
import { getAllTrades } from "@/trades/queries";
import { TradesTable } from "@/components/trades/trades-table";

export const dynamic = "force-dynamic";

export default async function TradesPage() {
  const trades = await getAllTrades(db);
  return <TradesTable trades={trades} />;
}
