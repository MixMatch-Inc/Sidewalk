import { describe, it, expect } from "vitest";

interface TokenPayload { sub: string; email: string; role: string; scope: string[]; exp: number; }
interface ApiIdentity  { id: string; email: string; role: string; scopes: string[]; }

function tokenToIdentity(t: TokenPayload): ApiIdentity {
  return { id: t.sub, email: t.email, role: t.role, scopes: t.scope };
}

describe("extended auth contract — token to identity", () => {
  const token: TokenPayload = {
    sub: "u99", email: "ext@test.com", role: "staff",
    scope: ["reports:read", "reports:write"], exp: 9999999999,
  };

  it("maps sub to id", () => {
    expect(tokenToIdentity(token).id).toBe("u99");
  });

  it("maps scope array to scopes", () => {
    expect(tokenToIdentity(token).scopes).toContain("reports:read");
  });

  it("preserves role", () => {
    expect(tokenToIdentity(token).role).toBe("staff");
  });
});
