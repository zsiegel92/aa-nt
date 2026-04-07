import { NextResponse, type NextRequest } from "next/server";

import { getAuthenticatedUserFromRequest } from "@/lib/auth/request";

export async function proxy(request: NextRequest) {
  const user = getAuthenticatedUserFromRequest(request);
  if (user) {
    return NextResponse.next();
  }
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/aa-to-nt", "/"],
};
