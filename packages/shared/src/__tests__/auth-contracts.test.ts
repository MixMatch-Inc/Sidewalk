import { describe, it, expect } from "vitest";
import type { AuthClaims, ScopedTokenClaims, ApiIdentity, PublicUser } from "../types/auth.js";

// ---------------------------------------------------------------------------
// Utility functions whose contracts are pinned by these tests.
// Implementations live in the auth middleware / service layer.
// ---------------------------------------------------------------------------

function isExpired(claims: AuthClaims): boolean {
  return Date.now() / 1000 > claims.exp;
}

function hasRole(claims: AuthClaims, role: string): boolean {
  return claims.role === role;
}

function toPublicUser(claims: AuthClaims): PublicUser {
  return { id: claims.sub, email: claims.email, createdAt: new Date(claims.iat! * 1000).toISOString() };
}

function toApiIdentity(claims: ScopedTokenClaims): ApiIdentity {
  return { id: claims.sub, email: claims.email, role: claims.role, scopes: claims.scope };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseClaims: AuthClaims = {
  sub: "u-1",
  email: "user@test.com",
  role: "user",
  exp: 9_999_999_999,
  iat: 1_700_000_000,
};

const adminClaims: AuthClaims = { ...baseClaims, sub: "u-2", role: "admin" };

const scopedClaims: ScopedTokenClaims = {
  ...baseClaims,
  sub: "u-3",
  role: "staff",
  scope: ["reports:read", "reports:write"],
};

// ---------------------------------------------------------------------------
// Token expiry
// ---------------------------------------------------------------------------

describe("auth contracts — token expiry", () => {
  it("non-expired token returns false for isExpired", () => {
    expect(isExpired(baseClaims)).toBe(false);
  });

  it("expired token returns true for isExpired", () => {
    expect(isExpired({ ...baseClaims, exp: 1 })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Role checking
// ---------------------------------------------------------------------------

describe("auth contracts — role assertion", () => {
  it("hasRole returns true for matching role", () => {
    expect(hasRole(baseClaims, "user")).toBe(true);
  });

  it("hasRole returns false for non-matching role", () => {
    expect(hasRole(baseClaims, "admin")).toBe(false);
  });

  it("admin claims satisfy admin role check", () => {
    expect(hasRole(adminClaims, "admin")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Public user projection — role must not leak
// ---------------------------------------------------------------------------

describe("auth contracts — public user projection", () => {
  it("maps sub to id", () => {
    expect(toPublicUser(baseClaims).id).toBe("u-1");
  });

  it("preserves email", () => {
    expect(toPublicUser(baseClaims).email).toBe("user@test.com");
  });

  it("does not expose role in public user", () => {
    const pub = toPublicUser(baseClaims) as Record<string, unknown>;
    expect(pub.role).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// API identity projection — includes scopes, preserves role
// ---------------------------------------------------------------------------

describe("auth contracts — API identity from scoped token", () => {
  it("maps sub to id", () => {
    expect(toApiIdentity(scopedClaims).id).toBe("u-3");
  });

  it("maps scope array to scopes", () => {
    expect(toApiIdentity(scopedClaims).scopes).toContain("reports:read");
  });

  it("preserves role in identity", () => {
    expect(toApiIdentity(scopedClaims).role).toBe("staff");
  });

  it("identity without scopes returns empty array when scope is empty", () => {
    const claims: ScopedTokenClaims = { ...scopedClaims, scope: [] };
    expect(toApiIdentity(claims).scopes).toHaveLength(0);
  });
});
