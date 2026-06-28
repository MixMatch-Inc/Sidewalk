import { describe, it, expect } from "vitest";

type AuthState = { token: string | null; role: string | null };

function createAuthState(token?: string, role?: string): AuthState {
  return { token: token ?? null, role: role ?? null };
}

function canAccessAdmin(state: AuthState): boolean {
  return state.token !== null && state.role === "admin";
}

describe("web scaffold — auth states", () => {
  it("creates unauthenticated state by default", () => {
    const s = createAuthState();
    expect(s.token).toBeNull();
    expect(s.role).toBeNull();
  });

  it("creates authenticated user state", () => {
    const s = createAuthState("tok123", "user");
    expect(s.token).toBe("tok123");
  });

  it("blocks non-admin from admin routes", () => {
    expect(canAccessAdmin(createAuthState("tok", "user"))).toBe(false);
  });

  it("allows admin through admin routes", () => {
    expect(canAccessAdmin(createAuthState("tok", "admin"))).toBe(true);
  });
});
