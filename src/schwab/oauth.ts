const AUTHORIZE_URL = "https://api.schwabapi.com/v1/oauth/authorize";
const TOKEN_URL = "https://api.schwabapi.com/v1/oauth/token";

function callbackUrl(): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL;
  if (!base) {
    throw new Error("NEXT_PUBLIC_BASE_URL is required to build the Schwab OAuth callback URL");
  }
  return `${base}/api/schwab/callback`;
}

/** The redirect_uri here must exactly match what's registered in the
 * Schwab developer dashboard for this app -- a mismatch fails the
 * authorize step outright, not just the token exchange. */
export function buildAuthorizeUrl(state: string): string {
  const appKey = process.env.SCHWAB_APP_KEY;
  if (!appKey) {
    throw new Error("SCHWAB_APP_KEY is required");
  }
  const params = new URLSearchParams({
    client_id: appKey,
    redirect_uri: callbackUrl(),
    response_type: "code",
    state,
  });
  return `${AUTHORIZE_URL}?${params}`;
}

export interface SchwabTokens {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

interface SchwabTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

/** Token endpoint auth is HTTP Basic with base64(appKey:appSecret) -- not
 * a body param, not a bearer token. Shared by both the initial code
 * exchange and every later refresh, which differ only in grant_type. */
async function postToTokenEndpoint(params: Record<string, string>): Promise<SchwabTokens> {
  const appKey = process.env.SCHWAB_APP_KEY;
  const appSecret = process.env.SCHWAB_APP_SECRET;
  if (!appKey || !appSecret) {
    throw new Error("SCHWAB_APP_KEY/SCHWAB_APP_SECRET are required");
  }

  const basic = Buffer.from(`${appKey}:${appSecret}`).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params).toString(),
  });

  if (!res.ok) {
    // Never log the response body -- Schwab's error payloads can echo
    // back request params, and this is a credential-adjacent code path.
    throw new Error(`Schwab token endpoint returned ${res.status}`);
  }

  const data: SchwabTokenResponse = await res.json();
  return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresInSeconds: data.expires_in };
}

export async function exchangeCodeForTokens(code: string): Promise<SchwabTokens> {
  return postToTokenEndpoint({ grant_type: "authorization_code", code, redirect_uri: callbackUrl() });
}

/** Refresh tokens are valid for 7 days, hard limit, no programmatic
 * renewal -- a refresh_token request against an expired one is rejected,
 * not silently extended. Callers must treat that as "the user needs to
 * reconnect," not a transient failure. */
export async function refreshAccessToken(refreshToken: string): Promise<SchwabTokens> {
  return postToTokenEndpoint({ grant_type: "refresh_token", refresh_token: refreshToken });
}
