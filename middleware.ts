import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Edge-safe route guard: checks for the *presence* of a valid-looking
 * session cookie (no DB call — that's deliberate, middleware runs on every
 * request). The dashboard layout itself calls `getCurrentUser()` (which
 * does hit the DB) to resolve the real user/agency and permissions, so a
 * forged/expired cookie still can't get past that second check — this
 * layer only exists to bounce obviously-signed-out visitors before they
 * render a single byte of the dashboard.
 */
const AUTH_ROUTES = ["/login", "/register"];
const PROTECTED_PREFIX = "/dashboard";

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  const isProtected = pathname.startsWith(PROTECTED_PREFIX);
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtected && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
