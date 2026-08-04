import { db } from "@/db";
import { schwabApiFetch } from "@/schwab/tokenClient";

export const dynamic = "force-dynamic";

/** Temporary, unauthenticated debug endpoint used once to discover Schwab's
 * real Trader API response shape against this app's own connected account
 * (there's no other way to see it -- developer.schwab.com blocks automated
 * fetches). Delete once the real sync mapper is built and verified. */
export async function GET() {
  const accountsRes = await schwabApiFetch(db, "/trader/v1/accounts/accountNumbers");
  const accountsBody = await accountsRes.text();
  if (!accountsRes.ok) {
    return Response.json({ step: "accountNumbers", status: accountsRes.status, body: accountsBody });
  }
  const accounts = JSON.parse(accountsBody);
  const hash = accounts[0]?.hashValue;

  if (!hash) {
    return Response.json({ step: "accountNumbers", accounts });
  }

  const end = new Date();
  const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    types: "TRADE",
  });
  const txRes = await schwabApiFetch(db, `/trader/v1/accounts/${hash}/transactions?${params}`);
  const txBody = await txRes.text();

  return Response.json({
    step: "transactions",
    accounts,
    txStatus: txRes.status,
    txBody: txBody.length > 20000 ? txBody.slice(0, 20000) + "...TRUNCATED" : JSON.parse(txBody || "null"),
  });
}
