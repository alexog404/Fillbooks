import { eq } from "drizzle-orm";
import type { Db } from "@/db";
import * as schema from "@/db/schema";
import { decryptToken, encryptToken } from "./encryption";

export type BrokerConnection = typeof schema.brokerConnections.$inferSelect;

const SCHWAB = "schwab";

export async function getSchwabConnection(db: Db): Promise<BrokerConnection | null> {
  const rows = await db
    .select()
    .from(schema.brokerConnections)
    .where(eq(schema.brokerConnections.broker, SCHWAB))
    .limit(1);
  return rows[0] ?? null;
}

export interface UpsertSchwabConnectionInput {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

/** One row per broker (unique constraint on `broker`), upserted rather
 * than appended -- there's only ever one live Schwab connection for this
 * single-tenant app. Tokens are encrypted here, at the write boundary, so
 * no caller ever has to remember to do it. */
export async function upsertSchwabConnection(db: Db, input: UpsertSchwabConnectionInput): Promise<void> {
  const values = {
    broker: SCHWAB,
    accessTokenEnc: encryptToken(input.accessToken),
    refreshTokenEnc: encryptToken(input.refreshToken),
    tokenExpiresAt: input.refreshTokenExpiresAt,
    status: "connected" as const,
  };
  await db
    .insert(schema.brokerConnections)
    .values(values)
    .onConflictDoUpdate({ target: schema.brokerConnections.broker, set: values });
}

export async function setSchwabConnectionStatus(db: Db, status: "disconnected" | "connected" | "expired"): Promise<void> {
  await db.update(schema.brokerConnections).set({ status }).where(eq(schema.brokerConnections.broker, SCHWAB));
}

/** Decrypts the stored refresh token for use against Schwab's token
 * endpoint. Throws (via decryptToken's auth-tag check) rather than
 * returning garbage if TOKEN_ENCRYPTION_KEY doesn't match what encrypted
 * it -- a wrong/rotated key must be a loud failure, not a corrupted sync. */
export function decryptRefreshToken(connection: BrokerConnection): string {
  if (!connection.refreshTokenEnc) {
    throw new Error("Broker connection has no stored refresh token");
  }
  return decryptToken(connection.refreshTokenEnc);
}
