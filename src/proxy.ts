import { NextResponse, type NextRequest } from "next/server";

const cookieName = "raj-tracker-auth";

function isPublicPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/icons/")
  );
}

export function proxy(request: NextRequest) {
  const authToken = process.env.TRACKER_AUTH_TOKEN?.trim();
  const lockEnabled = Boolean(process.env.TRACKER_PASSWORD?.trim() && authToken);
  const { pathname, search } = request.nextUrl;

  if (!lockEnabled || isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const cookieValue = request.cookies.get(cookieName)?.value;
  if (cookieValue === authToken) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!.*\\..*).*)", "/api/:path*"],
};
