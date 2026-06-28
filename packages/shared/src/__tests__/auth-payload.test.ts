import { describe, it, expect } from "vitest";

interface AuthClaims { sub: string; email: string; role: string; exp: number; }

function isExpired(claims: AuthClaims): boolean {
  return Date.now() / 1000 > claims.exp;
}

function hasRole(claims: AuthClaims, role: string): boolean {
  return claims.role === role;
}

describe("shared auth payload contracts", () => {
  const validClaims: AuthClaims = { sub: "u1", email: "u@test.com", role: "user", exp: 9999999999 };

  it("non-expired token returns false for isExpired", () => {
    expect(isExpired(validClaims)).toBe(false);
  });

  it("expired token returns true for isExpired", () => {
    expect(isExpired({ ...validClaims, exp: 1 })).toBe(true);
  });

  it("hasRole returns true for matching role", () => {
    expect(hasRole(validClaims, "user")).toBe(true);
  });

  it("hasRole returns false for non-matching role", () => {
    expect(hasRole(validClaims, "admin")).toBe(false);
  });
});
