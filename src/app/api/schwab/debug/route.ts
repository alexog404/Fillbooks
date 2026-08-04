import { syncSchwabAccount } from "@/schwab/sync";

export const dynamic = "force-dynamic";

/** Temporary trigger for a one-time full-history Schwab sync, used once
 * while replacing CSV-imported data with account-synced data. Delete once
 * that migration is done -- the real UI trigger is the Settings page's
 * Force Sync button, which calls syncSchwabAccount() with no override. */
export async function GET(req: Request) {
  const since = new URL(req.url).searchParams.get("since");
  const result = await syncSchwabAccount(since ? new Date(since) : undefined);
  return Response.json(result);
}
