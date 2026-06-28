import { describe, it, expect } from "vitest";

function isAuthenticated(cookies: Record<string, string>): boolean {
  return Boolean(cookies["auth_token"]);
}

function getRedirectTarget(pathname: string, authed: boolean): string | null {
  const protectedPaths = ["/dashboard", "/reports/new", "/profile"];
  if (!authed && protectedPaths.some((p) => pathname.startsWith(p))) {
    return `/login?next=${encodeURIComponent(pathname)}`;
  }
  return null;
}

describe("web — auth scaffold", () => {
  it("treats request with auth_token cookie as authenticated", () => {
    expect(isAuthenticated({ auth_token: "tok" })).toBe(true);
  });

  it("treats request with no cookies as unauthenticated", () => {
    expect(isAuthenticated({})).toBe(false);
  });

  it("redirects unauthenticated user away from protected path", () => {
    expect(getRedirectTarget("/dashboard", false)).toContain("/login");
  });

  it("allows unauthenticated user on public path", () => {
    expect(getRedirectTarget("/", false)).toBeNull();
  });
});
