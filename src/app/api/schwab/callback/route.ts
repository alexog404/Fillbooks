import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { exchangeCodeForTokens } from "@/schwab/oauth";
import { upsertSchwabConnection } from "@/schwab/connectionQueries";
import { STATE_COOKIE } from "../authorize/route";

export const dynamic = "force-dynamic";

const REFRESH_TOKEN_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

function redirectToSettings(request: NextRequest, param: string): NextResponse {
  const response = NextResponse.redirect(new URL(`/settings?${param}`, request.url));
  response.cookies.delete(STATE_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const error = params.get("error");
  const cookieState = request.cookies.get(STATE_COOKIE)?.value;

  // The user denying consent, or Schwab rejecting the request outright,
  // both surface as an `error` query param rather than a `code` -- not a
  // failure of this app's own code, just a normal outcome to handle.
  if (error) {
    return redirectToSettings(request, `schwab_error=${encodeURIComponent(error)}`);
  }

  // The state cookie set in /api/schwab/authorize must round-trip
  // unchanged -- this is the CSRF protection for the whole flow. Missing
  // or mismatched state is treated identically to "reject," regardless of
  // which one it is, so no information about *why* leaks to the redirect.
  if (!code || !state || !cookieState || state !== cookieState) {
    return redirectToSettings(request, "schwab_error=invalid_state");
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    await upsertSchwabConnection(db, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      refreshTokenExpiresAt: new Date(Date.now() + REFRESH_TOKEN_LIFETIME_MS),
    });
  } catch (err) {
    console.error("Schwab OAuth callback failed:", err instanceof Error ? err.message : "unknown error");
    return redirectToSettings(request, "schwab_error=token_exchange_failed");
  }

  return redirectToSettings(request, "schwab_connected=1");
}
