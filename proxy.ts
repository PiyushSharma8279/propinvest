import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, verifyToken } from "@/lib/auth/jwt";

/**
 * Page-level access control (Next.js 16 renamed middleware.ts to proxy.ts).
 *
 * - /admin/**            admins only
 * - /account/**          any signed-in user
 * - /login              signed-out users only
 * - everything else      public
 *
 * API routes do their own checks in the controllers (requireAdmin / requireUser), which also
 * re-read the user from the database — this file only reads the JWT, so it stays fast.
 */

const ADMIN_PREFIX = "/admin";
const USER_PREFIXES = ["/account"];
const GUEST_ONLY = ["/login"];

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function redirectToLogin(request: NextRequest) {
  const url = new URL("/login", request.url);
  url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const user = await verifyToken(request.cookies.get(AUTH_COOKIE)?.value);

  if (startsWithAny(pathname, [ADMIN_PREFIX])) {
    if (!user) return redirectToLogin(request);
    if (user.role !== "admin") return NextResponse.redirect(new URL("/account", request.url));
  }

  if (startsWithAny(pathname, USER_PREFIXES) && !user) {
    return redirectToLogin(request);
  }

  if (startsWithAny(pathname, GUEST_ONLY) && user) {
    return NextResponse.redirect(new URL(user.role === "admin" ? "/admin" : "/account", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/login"],
};
