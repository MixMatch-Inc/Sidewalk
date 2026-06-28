import { describe, it, expect } from "vitest";

interface AuthToken { sub: string; email: string; role: "user" | "admin"; iat: number; exp: number; }
interface PublicUserPayload { id: string; email: string; }

function extractPublicUser(token: AuthToken): PublicUserPayload {
  return { id: token.sub, email: token.email };
}

describe("contract — shared auth token to public user", () => {
  const token: AuthToken = { sub: "abc", email: "t@test.com", role: "user", iat: 0, exp: 9999999999 };

  it("extracts id from sub", () => {
    expect(extractPublicUser(token).id).toBe("abc");
  });

  it("preserves email", () => {
    expect(extractPublicUser(token).email).toBe("t@test.com");
  });

  it("does not expose role in public payload", () => {
    const pub = extractPublicUser(token) as Record<string, unknown>;
    expect(pub.role).toBeUndefined();
  });
});
