/**
 * Secure session-storage abstraction for mobile auth.
 *
 * The interface is kept narrow so any backing store — AsyncStorage, Keychain,
 * or expo-secure-store — can be swapped in without touching call sites.
 *
 * Development note (iOS simulator / Android emulator):
 *   expo-secure-store works on physical devices. On simulators it still
 *   functions but does not use the hardware Secure Enclave / Keystore.
 *   For local development the in-memory fallback below is sufficient.
 *
 * To upgrade to expo-secure-store:
 *   1. `npx expo install expo-secure-store`
 *   2. Replace `activeSessionStorage` below with `expoSecureSessionStorage`.
 */

import type { SessionTokens } from "@sidewalk/types";

// ── Storage key constants ─────────────────────────────────────────────────────

const KEY_ACCESS = "sw_auth_access";
const KEY_REFRESH = "sw_auth_refresh";

// ── Low-level key/value interface ─────────────────────────────────────────────

/** Synchronous or async key/value store used by the session layer. */
export interface SecureKVStore {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

// ── In-memory implementation (default; works everywhere) ─────────────────────

export class MemoryKVStore implements SecureKVStore {
  private map = new Map<string, string>();

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }
}

// ── Session storage built on top of the KV interface ─────────────────────────

export class SessionStorage {
  constructor(private readonly kv: SecureKVStore) {}

  async getTokens(): Promise<SessionTokens | null> {
    const [access, refresh] = await Promise.all([
      this.kv.getItem(KEY_ACCESS),
      this.kv.getItem(KEY_REFRESH),
    ]);
    if (!access || !refresh) return null;
    return { accessToken: access, refreshToken: refresh };
  }

  async setTokens(tokens: SessionTokens): Promise<void> {
    await Promise.all([
      this.kv.setItem(KEY_ACCESS, tokens.accessToken),
      this.kv.setItem(KEY_REFRESH, tokens.refreshToken),
    ]);
  }

  async clearTokens(): Promise<void> {
    await Promise.all([
      this.kv.removeItem(KEY_ACCESS),
      this.kv.removeItem(KEY_REFRESH),
    ]);
  }
}

// ── Default instance used by the app ─────────────────────────────────────────

export const sessionStorage = new SessionStorage(new MemoryKVStore());
