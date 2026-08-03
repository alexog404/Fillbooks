import { db } from "@/db";
import { getAllTrades } from "@/trades/queries";
import { getStartingBalance } from "@/settings/queries";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const trades = await getAllTrades(db);
  const startingBalance = await getStartingBalance(db);
  return <DashboardClient trades={trades} startingBalance={startingBalance ?? 0} />;
}
