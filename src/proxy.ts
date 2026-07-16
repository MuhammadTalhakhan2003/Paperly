import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Optimistic auth redirects (Next.js 16 "Proxy", formerly Middleware).
// This only checks for the presence of the session cookie for fast redirects —
// real verification happens in server components / route handlers via the DAL.
const PROTECTED_PREFIXES = ["/dashboard", "/documents"];
const AUTH_ROUTES = ["/login", "/signup"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get("paperly_session")?.value);

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (isProtected && !hasSession) {
    const url = new URL("/login", request.nextUrl);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (AUTH_ROUTES.includes(pathname) && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/documents/:path*", "/login", "/signup"],
};
