/**
 * Auth fixture factory for web and mobile integration work (#399).
 *
 * Provides deterministic, strongly-typed test data for the batch-1 auth
 * scenarios. Import these in tests or Storybook stories instead of
 * inventing ad-hoc literals each time.
 */

import type {
  AuthSessionPayload,
  AuthUser,
  LoginResponse,
  RegisterResponse,
  SessionTokens,
} from "../auth.js";

// ── Base fixtures ─────────────────────────────────────────────────────────────

export const FIXTURE_TOKENS: SessionTokens = {
  accessToken: "test-access-token-aaaa",
  refreshToken: "test-refresh-token-bbbb",
};

export const FIXTURE_USER_UNVERIFIED: AuthUser = {
  id: "usr_unverified_001",
  email: "unverified@sidewalk.test",
  verified: false,
};

export const FIXTURE_USER_VERIFIED: AuthUser = {
  id: "usr_verified_001",
  email: "verified@sidewalk.test",
  verified: true,
};

// ── LoginResponse fixtures ────────────────────────────────────────────────────

export const FIXTURE_LOGIN_VERIFIED: LoginResponse = {
  ...FIXTURE_TOKENS,
  account: { ...FIXTURE_USER_VERIFIED },
};

export const FIXTURE_LOGIN_UNVERIFIED: LoginResponse = {
  ...FIXTURE_TOKENS,
  account: { ...FIXTURE_USER_UNVERIFIED },
};

// ── AuthSessionPayload fixtures ───────────────────────────────────────────────

export const FIXTURE_SESSION_VERIFIED: AuthSessionPayload = {
  ...FIXTURE_TOKENS,
  user: { ...FIXTURE_USER_VERIFIED },
  issuedAt: "2026-01-01T00:00:00.000Z",
};

export const FIXTURE_SESSION_UNVERIFIED: AuthSessionPayload = {
  ...FIXTURE_TOKENS,
  user: { ...FIXTURE_USER_UNVERIFIED },
  issuedAt: "2026-01-01T00:00:00.000Z",
};

// ── RegisterResponse fixture ──────────────────────────────────────────────────

export const FIXTURE_REGISTER_RESPONSE: RegisterResponse = {
  id: "usr_new_001",
  email: "new-user@sidewalk.test",
  verified: false,
  createdAt: "2026-01-01T00:00:00.000Z",
};

// ── Factory helpers ───────────────────────────────────────────────────────────

/** Create a custom AuthUser with sensible defaults. */
export function makeAuthUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return { ...FIXTURE_USER_VERIFIED, ...overrides };
}

/** Create a custom AuthSessionPayload with sensible defaults. */
export function makeSession(overrides: Partial<AuthSessionPayload> = {}): AuthSessionPayload {
  return { ...FIXTURE_SESSION_VERIFIED, ...overrides };
}

/** Create a custom LoginResponse with sensible defaults. */
export function makeLoginResponse(overrides: Partial<LoginResponse> = {}): LoginResponse {
  return { ...FIXTURE_LOGIN_VERIFIED, ...overrides };
}
