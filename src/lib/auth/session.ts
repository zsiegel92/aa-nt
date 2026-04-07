import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

import {
  getAllowedUsers,
  getSessionSecret,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/config";

export type AuthenticatedUser = {
  username: string;
};

function secureEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function buildSignature(username: string, issuedAt: string): string {
  return createHmac("sha256", getSessionSecret())
    .update(`${username}\0${issuedAt}`)
    .digest("hex");
}

export function validateCredentials(
  username: string,
  password: string
): AuthenticatedUser | null {
  const matchingUser = getAllowedUsers().find((user) =>
    secureEqual(user.username, username.trim())
  );
  if (!matchingUser) {
    return null;
  }
  if (!secureEqual(matchingUser.password, password)) {
    return null;
  }
  return { username: matchingUser.username };
}

export function createSessionCookieValue(user: AuthenticatedUser): string {
  const issuedAt = `${Math.floor(Date.now() / 1000)}`;
  const signature = buildSignature(user.username, issuedAt);
  return `${user.username}.${issuedAt}.${signature}`;
}

export function readSessionCookieValue(
  cookieValue: string | undefined | null
): AuthenticatedUser | null {
  if (!cookieValue) {
    return null;
  }
  const [username, issuedAt, signature] = cookieValue.split(".");
  if (!username || !issuedAt || !signature) {
    return null;
  }
  if (!/^\d+$/.test(issuedAt)) {
    return null;
  }
  const expectedSignature = buildSignature(username, issuedAt);
  if (!secureEqual(signature, expectedSignature)) {
    return null;
  }
  const issuedAtSeconds = Number.parseInt(issuedAt, 10);
  const now = Math.floor(Date.now() / 1000);
  if (now - issuedAtSeconds > SESSION_MAX_AGE_SECONDS) {
    return null;
  }
  const userStillAllowed = getAllowedUsers().some((allowedUser) =>
    secureEqual(allowedUser.username, username)
  );
  return userStillAllowed ? { username } : null;
}
