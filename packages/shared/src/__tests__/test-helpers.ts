/**
 * Canonical test factories for the Sidewalk monorepo.
 *
 * Types are derived from the shared package exports so that factory shapes
 * stay aligned with the real data contracts without duplication.
 */
import type { AuthClaims, ScopedTokenClaims, PublicUser } from "../types/auth.js";
import type { ReportSubmission } from "../types/civic.js";
import type { Visibility } from "../types/enums.js";

// ---------------------------------------------------------------------------
// Identity / auth helpers
// ---------------------------------------------------------------------------

export interface TestIdentity {
  sub: string;
  email: string;
  role: "user" | "admin" | "staff" | "moderator";
  exp: number;
  iat: number;
}

export function makeIdentity(overrides: Partial<TestIdentity> = {}): TestIdentity {
  return {
    sub: "test-user-id",
    email: "test@sidewalk.dev",
    role: "user",
    exp: 9_999_999_999,
    iat: 1_700_000_000,
    ...overrides,
  };
}

export function makeAuthClaims(overrides: Partial<AuthClaims> = {}): AuthClaims {
  return makeIdentity(overrides as Partial<TestIdentity>);
}

export function makeScopedClaims(
  scopes: string[] = ["reports:read"],
  overrides: Partial<ScopedTokenClaims> = {},
): ScopedTokenClaims {
  return { ...makeIdentity(), scope: scopes, ...overrides };
}

export function authHeader(token = "test-token"): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

// ---------------------------------------------------------------------------
// User helpers (DB-aligned: no role field on User model)
// ---------------------------------------------------------------------------

export interface TestUser {
  id: string;
  email: string;
  passwordHash: string;
  displayName?: string;
}

export function makeUser(overrides: Partial<TestUser> = {}): TestUser {
  return {
    id: "test-user-id",
    email: "test@sidewalk.dev",
    passwordHash: "hashed-password",
    displayName: "Test User",
    ...overrides,
  };
}

export function makePublicUser(overrides: Partial<PublicUser> = {}): PublicUser {
  return {
    id: "test-user-id",
    email: "test@sidewalk.dev",
    createdAt: new Date(0).toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Report helpers (aligned to ReportSubmission + Prisma Report shape)
// ---------------------------------------------------------------------------

export function makeReportSubmission(
  overrides: Partial<ReportSubmission> = {},
): ReportSubmission {
  return {
    title: "Test Report",
    description: "A test report description.",
    visibility: "public" as Visibility,
    ...overrides,
  };
}

export interface TestReport {
  id: string;
  authorId: string;
  title: string;
  description: string;
  status: "draft" | "submitted" | "under_review" | "resolved" | "closed";
  visibility: Visibility;
}

export function makeReport(overrides: Partial<TestReport> = {}): TestReport {
  return {
    id: "test-report-id",
    authorId: "test-user-id",
    title: "Test Report",
    description: "A test report description.",
    status: "draft",
    visibility: "public" as Visibility,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// HTTP test context
// ---------------------------------------------------------------------------

export interface ModuleTestContext {
  userId: string;
  token: string;
  baseUrl: string;
}

export function makeTestContext(overrides: Partial<ModuleTestContext> = {}): ModuleTestContext {
  return {
    userId: "test-user-id",
    token: "test-token",
    baseUrl: "http://localhost:3001",
    ...overrides,
  };
}

export const TEST_TOKENS = {
  user: "test.user.token",
  admin: "test.admin.token",
  anon: "",
} as const;
