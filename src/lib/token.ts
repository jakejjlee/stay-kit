import { randomBytes } from "node:crypto";

/** 32 bytes of randomness, base64url. Guessing is not a threat model at this length. */
export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export function isValidToken(t: string): boolean {
  return /^[A-Za-z0-9_-]{43,}$/.test(t);
}
