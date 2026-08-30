import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Two jobs:
 *   1. Multi-tenant subdomain resolution — turn `{agency}.rentflow.ma` (or
 *      `{agency}.localhost` in dev) into an `x-agency-subdomain` request header
 *      that the marketing pages read via lib/public-agency.ts. The header is
 *      always stripped from the incoming request first, so a client can't spoof
 *      it — it only ever reflects the real Host.
 *   2. Edge auth guard — bounce signed-out visitors off /dashboard and signed-in
 *      visitors off the auth pages (the real check still happens in the
 *      dashboard layout via getCurrentUser).
 */

const BASE_DOMAIN = "rentflow.ma";
const AUTH_ROUTES = ["/login", "/register"];

function extractSubdomain(host: string): string | null {
  const h = host.split(":")[0].toLowerCase();
  let label: string | null = null;
  if (h.endsWith(".localhost")) {
    label = h.slice(0, -".localhost".length);
  } else if (h.endsWith(`.${BASE_DOMAIN}`)) {
    label = h.slice(0, -`.${BASE_DOMAIN}`.length);
  }
  if (!label) return null;
  const first = label.split(".")[0];
  if (!first || first === "www" || first === "app") return null;
  return first;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-agency-subdomain");
  const subdomain = extractSubdomain(request.headers.get("host") ?? "");
  if (subdomain) requestHeaders.set("x-agency-subdomain", subdomain);

  const sessionCookie = getSessionCookie(request);

  if (pathname.startsWith("/dashboard") && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (AUTH_ROUTES.some((route) => pathname.startsWith(route)) && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Run on everything except API routes and static assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
