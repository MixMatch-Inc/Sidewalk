/**
 * In-memory store for short-lived single-use tokens (email verification, password reset).
 * Each token expires after TTL_MS and is consumed on first use.
 */

import { randomBytes } from "node:crypto";

export type TokenKind = "verify" | "reset";

type TokenRecord = {
  accountId: string;
  kind: TokenKind;
  expiresAt: Date;
};

const TTL_MS = 60 * 60 * 1000; // 1 hour

export class MemoryTokenStore {
  private readonly tokens = new Map<string, TokenRecord>();

  issue(accountId: string, kind: TokenKind): string {
    const token = randomBytes(32).toString("base64url");
    this.tokens.set(token, { accountId, kind, expiresAt: new Date(Date.now() + TTL_MS) });
    return token;
  }

  /** Consume a token — returns accountId on success, null if invalid/expired. */
  consume(token: string, kind: TokenKind): string | null {
    const record = this.tokens.get(token);
    if (!record || record.kind !== kind) return null;
    this.tokens.delete(token);
    if (record.expiresAt < new Date()) return null;
    return record.accountId;
  }
}
