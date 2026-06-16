import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const isAdmin = !!(payload.is_staff || payload.is_superuser);

      if (isAdmin && request.nextUrl.pathname === "/landing") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      if (!isAdmin && request.nextUrl.pathname.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/orders", request.url));
      }
    } catch {
      // malformed token — let the page handle it
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/landing", "/dashboard/:path*"],
};
