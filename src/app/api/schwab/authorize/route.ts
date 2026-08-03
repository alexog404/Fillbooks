import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { buildAuthorizeUrl } from "@/schwab/oauth";

export const STATE_COOKIE = "schwab_oauth_state";
export const dynamic = "force-dynamic";

export async function GET() {
  const state = randomBytes(32).toString("base64url");
  const response = NextResponse.redirect(buildAuthorizeUrl(state));
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes -- plenty to get through Schwab's login/consent screen
    path: "/",
  });
  return response;
}
