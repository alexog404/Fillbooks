import type { Db } from "@/db";
import { refreshAccessToken } from "./oauth";
import { getSchwabConnection, decryptRefreshToken, upsertSchwabConnection, setSchwabConnectionStatus } from "./connectionQueries";
import { decryptToken } from "./encryption";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export class SchwabNotConnectedError extends Error {}

/** Refreshes and persists a new access/refresh token pair. Schwab reissues
 * a refresh token on every refresh call, each good for another 7 days from
 * that moment -- so a connection that's refreshed at least once a week
 * never forces a real re-login. If Schwab rejects the stored refresh token
 * outright (its own 7-day window lapsed with no refresh in between), that's
 * a hard stop -- mark the connection expired rather than retrying. */
async function refreshAndStore(db: Db): Promise<string> {
  const connection = await getSchwabConnection(db);
  if (!connection) throw new SchwabNotConnectedError("Schwab is not connected");

  let refreshToken: string;
  try {
    refreshToken = decryptRefreshToken(connection);
  } catch {
    throw new SchwabNotConnectedError("Schwab is not connected");
  }

  try {
    const tokens = await refreshAccessToken(refreshToken);
    await upsertSchwabConnection(db, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      refreshTokenExpiresAt: new Date(Date.now() + SEVEN_DAYS_MS),
    });
    return tokens.accessToken;
  } catch (err) {
    await setSchwabConnectionStatus(db, "expired");
    throw err;
  }
}

/** Calls a Schwab API endpoint with a valid access token, transparently
 * refreshing once on a 401 (the access token's own ~30min freshness isn't
 * tracked separately -- trying it and refreshing on rejection is simpler
 * and just as correct as tracking a second expiry clock). */
export async function schwabApiFetch(db: Db, path: string, init?: RequestInit): Promise<Response> {
  const connection = await getSchwabConnection(db);
  if (!connection || connection.status !== "connected" || !connection.accessTokenEnc) {
    throw new SchwabNotConnectedError("Schwab is not connected");
  }

  const url = `https://api.schwabapi.com${path}`;
  let accessToken = decryptToken(connection.accessTokenEnc);

  let res = await fetch(url, { ...init, headers: { ...init?.headers, Authorization: `Bearer ${accessToken}` } });

  if (res.status === 401) {
    accessToken = await refreshAndStore(db);
    res = await fetch(url, { ...init, headers: { ...init?.headers, Authorization: `Bearer ${accessToken}` } });
  }

  return res;
}
