import { db } from "@/db";
import { getAllTrades } from "@/trades/queries";
import { ReportsClient } from "@/components/reports/reports-client";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const trades = await getAllTrades(db);
  return <ReportsClient trades={trades} />;
}
