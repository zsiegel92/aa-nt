import "server-only";

import { createHash } from "crypto";

export type AllowedUser = {
  username: string;
  password: string;
};

export const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME ?? "aa_to_nt_session";
export const SESSION_MAX_AGE_SECONDS = Number.parseInt(
  process.env.SESSION_MAX_AGE_SECONDS ?? `${60 * 60 * 24 * 30}`,
  10
);

export function getAllowedUsers(): readonly AllowedUser[] {
  const username = process.env.USERNAME;
  const password = process.env.PASSWORD;
  if (!username || !password) {
    throw new Error("USERNAME and PASSWORD must be set");
  }
  return [{ username, password }] as const;
}

export function getSessionSecret(): Buffer {
  const explicitSecret = process.env.SESSION_SECRET;
  if (explicitSecret) {
    return createHash("sha256").update(explicitSecret).digest();
  }
  const material = getAllowedUsers()
    .map((user) => `${user.username}\0${user.password}`)
    .sort()
    .join("\n");
  return createHash("sha256")
    .update(`${material}\0aa-to-nt-session`)
    .digest();
}
