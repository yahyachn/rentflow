import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Edge auth guard: bounce signed-out visitors off /dashboard and signed-in
 * visitors off /login. The real check still happens in the dashboard layout
 * via getCurrentUser.
 *
 * This product is single-tenant (one Agency row) — see
 * lib/public-agency.ts#getMarketingAgency, which resolves that one agency
 * directly. There's no per-tenant subdomain routing to do here anymore.
 */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie = getSessionCookie(request);

  if (pathname.startsWith("/dashboard") && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/login") && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except API routes and static assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
