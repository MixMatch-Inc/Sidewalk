import { describe, it, expect } from "vitest";

interface PageContext { path: string; cookies: Record<string, string>; }

function isProtectedPath(path: string): boolean {
  const guarded = ["/dashboard", "/reports", "/profile", "/admin"];
  return guarded.some((g) => path.startsWith(g));
}

function resolveAccess(ctx: PageContext): "allow" | "redirect-login" | "redirect-dashboard" {
  const authed = Boolean(ctx.cookies["auth_token"]);
  const isAdmin = ctx.cookies["user_role"] === "admin";
  if (!authed && isProtectedPath(ctx.path)) return "redirect-login";
  if (authed && ctx.path.startsWith("/admin") && !isAdmin) return "redirect-dashboard";
  return "allow";
}

describe("web — refined test scaffold", () => {
  it("allows public path without auth", () => {
    expect(resolveAccess({ path: "/", cookies: {} })).toBe("allow");
  });
  it("redirects unauthenticated user from dashboard", () => {
    expect(resolveAccess({ path: "/dashboard", cookies: {} })).toBe("redirect-login");
  });
  it("redirects non-admin from admin route", () => {
    expect(resolveAccess({ path: "/admin", cookies: { auth_token: "tok", user_role: "user" } })).toBe("redirect-dashboard");
  });
  it("allows admin to admin route", () => {
    expect(resolveAccess({ path: "/admin", cookies: { auth_token: "tok", user_role: "admin" } })).toBe("allow");
  });
});
