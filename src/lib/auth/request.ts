import { type NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/config";
import {
  type AuthenticatedUser,
  readSessionCookieValue,
} from "@/lib/auth/session";

export function getAuthenticatedUserFromRequest(
  request: NextRequest,
): AuthenticatedUser | null {
  return readSessionCookieValue(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
  );
}
