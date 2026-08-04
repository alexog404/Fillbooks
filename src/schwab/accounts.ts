import type { Db } from "@/db";
import { schwabApiFetch } from "./tokenClient";
import type { SchwabTransaction } from "./syncMapper";

export async function fetchAccountHash(db: Db): Promise<string> {
  const res = await schwabApiFetch(db, "/trader/v1/accounts/accountNumbers");
  if (!res.ok) throw new Error(`Schwab accountNumbers returned ${res.status}`);
  const accounts: { accountNumber: string; hashValue: string }[] = await res.json();
  if (accounts.length === 0) throw new Error("No Schwab accounts found on this connection");
  return accounts[0].hashValue;
}

export async function fetchTransactions(db: Db, accountHash: string, startDate: Date, endDate: Date): Promise<SchwabTransaction[]> {
  const params = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    types: "TRADE",
  });
  const res = await schwabApiFetch(db, `/trader/v1/accounts/${accountHash}/transactions?${params}`);
  if (!res.ok) throw new Error(`Schwab transactions returned ${res.status}`);
  return res.json();
}
