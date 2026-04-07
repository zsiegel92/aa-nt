import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createSessionCookieValue,
  readSessionCookieValue,
  validateCredentials,
} from "@/lib/auth/session";

describe("auth session helpers", () => {
  afterEach(() => {
    vi.useRealTimers();
    delete process.env.USERNAME;
    delete process.env.PASSWORD;
    delete process.env.SESSION_SECRET;
  });

  it("validates env-backed credentials and reads a signed session cookie", () => {
    process.env.USERNAME = "demo-user";
    process.env.PASSWORD = "demo-pass";
    process.env.SESSION_SECRET = "test-secret";

    const user = validateCredentials("demo-user", "demo-pass");

    expect(user).toEqual({ username: "demo-user" });
    const cookieValue = createSessionCookieValue(user!);
    expect(readSessionCookieValue(cookieValue)).toEqual({ username: "demo-user" });
  });

  it("rejects expired session cookies", () => {
    process.env.USERNAME = "demo-user";
    process.env.PASSWORD = "demo-pass";
    process.env.SESSION_SECRET = "test-secret";

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-06T12:00:00Z"));
    const cookieValue = createSessionCookieValue({ username: "demo-user" });
    vi.setSystemTime(new Date("2026-05-10T12:00:00Z"));

    expect(readSessionCookieValue(cookieValue)).toBeNull();
  });
});
