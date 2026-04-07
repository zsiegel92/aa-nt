import { NextResponse } from "next/server";
import { z } from "zod";

import { SESSION_COOKIE_NAME } from "@/lib/auth/config";
import { sessionCookieOptions } from "@/lib/auth/server";
import {
  createSessionCookieValue,
  validateCredentials,
} from "@/lib/auth/session";

const loginBodySchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = loginBodySchema.parse(await request.json());
  const user = validateCredentials(body.username, body.password);
  if (!user) {
    return NextResponse.json(
      { error: "Incorrect username or password." },
      { status: 401 }
    );
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    SESSION_COOKIE_NAME,
    createSessionCookieValue(user),
    sessionCookieOptions
  );
  return response;
}
