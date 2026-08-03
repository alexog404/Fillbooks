import { db } from "@/db";
import { getAllTrades } from "@/trades/queries";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const trades = await getAllTrades(db);
  return <DashboardClient trades={trades} />;
}
