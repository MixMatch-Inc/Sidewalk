import { describe, it, expect } from "vitest";

type SessionState = { authenticated: boolean; role: string | null; userId: string | null };

function buildSession(token?: string, role?: string, userId?: string): SessionState {
  return { authenticated: !!token, role: role ?? null, userId: userId ?? null };
}

function canViewDashboard(session: SessionState): boolean {
  return session.authenticated;
}

function canManageReports(session: SessionState): boolean {
  return session.authenticated && (session.role === "staff" || session.role === "admin");
}

describe("web — extended auth scaffold", () => {
  it("unauthenticated session blocks dashboard", () => {
    expect(canViewDashboard(buildSession())).toBe(false);
  });

  it("authenticated resident can view dashboard", () => {
    expect(canViewDashboard(buildSession("tok", "resident", "u1"))).toBe(true);
  });

  it("staff can manage reports", () => {
    expect(canManageReports(buildSession("tok", "staff", "u2"))).toBe(true);
  });

  it("resident cannot manage reports", () => {
    expect(canManageReports(buildSession("tok", "resident", "u1"))).toBe(false);
  });
});
