import { describe, it, expect } from "vitest";

interface AuthPayload { userId: string; email: string; role: string; }
interface PublicUser  { id: string; email: string; }

function toPublicUser(auth: AuthPayload): PublicUser {
  return { id: auth.userId, email: auth.email };
}

describe("auth contract — shared payloads", () => {
  it("maps AuthPayload to PublicUser correctly", () => {
    const auth: AuthPayload = { userId: "u1", email: "a@b.com", role: "user" };
    const pub = toPublicUser(auth);
    expect(pub.id).toBe("u1");
    expect(pub.email).toBe("a@b.com");
    expect((pub as Record<string, unknown>).role).toBeUndefined();
  });

  it("preserves email in public user", () => {
    const auth: AuthPayload = { userId: "u2", email: "x@y.com", role: "admin" };
    expect(toPublicUser(auth).email).toBe("x@y.com");
  });
});
