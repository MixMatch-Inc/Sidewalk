/**
 * Contract tests for web authentication state and route access.
 *
 * These are pure logic tests — no rendering — that pin the session model the
 * rest of the web layer is built on. The real implementation lives in
 * lib/authContext.tsx (token stored in localStorage, user resolved from API).
 *
 * Role vocabulary is aligned with @sidewalk/shared: user | staff | admin | moderator.
 * "resident" is intentionally absent — use "user" for regular citizens.
 */
import { describe, it, expect } from "vitest";
import type { PublicUser } from "@sidewalk/shared";

// ---------------------------------------------------------------------------
// Session model — mirrors AuthContextValue shape
// ---------------------------------------------------------------------------

interface WebSession {
  user: PublicUser | null;
  token: string | null;
}

type AuthRole = "user" | "staff" | "admin" | "moderator";

/** Extended session — token decoded to expose role for route guards. */
interface AuthenticatedSession extends WebSession {
  user: PublicUser;
  token: string;
  role: AuthRole;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const GUEST: WebSession = { user: null, token: null };

function makeSession(
  email = "user@example.com",
  role: AuthRole = "user",
): AuthenticatedSession {
  return {
    user: { id: "test-user-id", email, createdAt: new Date(0).toISOString() },
    token: "test-token",
    role,
  };
}

// ---------------------------------------------------------------------------
// Auth detection helpers
// ---------------------------------------------------------------------------

function isAuthenticated(session: WebSession): boolean {
  return session.user !== null && session.token !== null;
}

// ---------------------------------------------------------------------------
// Route classification
// ---------------------------------------------------------------------------

const PROTECTED_PATHS = ["/dashboard", "/reports", "/profile", "/admin"];
const ADMIN_ONLY_PATHS = ["/admin"];
const STAFF_PATHS = ["/reports/manage", "/reports/review"];

function requiresAuth(path: string): boolean {
  return PROTECTED_PATHS.some((p) => path.startsWith(p));
}

function requiresAdmin(path: string): boolean {
  return ADMIN_ONLY_PATHS.some((p) => path.startsWith(p));
}

function requiresStaff(path: string): boolean {
  return STAFF_PATHS.some((p) => path.startsWith(p));
}

// ---------------------------------------------------------------------------
// Route access resolution
// ---------------------------------------------------------------------------

type AccessOutcome = "allow" | "redirect-login" | "redirect-home";

function resolveAccess(path: string, session: WebSession): AccessOutcome {
  if (!isAuthenticated(session)) {
    return requiresAuth(path) ? "redirect-login" : "allow";
  }
  const { role } = session as AuthenticatedSession;
  if (requiresAdmin(path) && role !== "admin") return "redirect-home";
  if (requiresStaff(path) && role !== "staff" && role !== "admin") return "redirect-home";
  return "allow";
}

function buildLoginRedirect(path: string): string {
  return `/login?next=${encodeURIComponent(path)}`;
}

// ---------------------------------------------------------------------------
// Tests — session state detection
// ---------------------------------------------------------------------------

describe("web auth — session state detection", () => {
  it("null user + null token = unauthenticated", () => {
    expect(isAuthenticated(GUEST)).toBe(false);
  });

  it("user + token = authenticated", () => {
    expect(isAuthenticated(makeSession())).toBe(true);
  });

  it("token present but no user = unauthenticated (partial hydration)", () => {
    expect(isAuthenticated({ user: null, token: "orphaned-token" })).toBe(false);
  });

  it("user present but no token = unauthenticated (stale state)", () => {
    expect(
      isAuthenticated({ user: makeSession().user, token: null }),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Tests — path classification
// ---------------------------------------------------------------------------

describe("web auth — path classification", () => {
  it("/ is public", () => expect(requiresAuth("/")).toBe(false));
  it("/login is public", () => expect(requiresAuth("/login")).toBe(false));
  it("/register is public", () => expect(requiresAuth("/register")).toBe(false));
  it("/dashboard requires auth", () => expect(requiresAuth("/dashboard")).toBe(true));
  it("/reports requires auth", () => expect(requiresAuth("/reports")).toBe(true));
  it("/profile requires auth", () => expect(requiresAuth("/profile")).toBe(true));
  it("/admin requires auth and is admin-only", () => {
    expect(requiresAuth("/admin")).toBe(true);
    expect(requiresAdmin("/admin")).toBe(true);
  });
  it("/reports/manage is staff-guarded", () => expect(requiresStaff("/reports/manage")).toBe(true));
});

// ---------------------------------------------------------------------------
// Tests — access resolution for unauthenticated users
// ---------------------------------------------------------------------------

describe("web auth — unauthenticated access", () => {
  it("public path passes through", () => {
    expect(resolveAccess("/", GUEST)).toBe("allow");
    expect(resolveAccess("/login", GUEST)).toBe("allow");
    expect(resolveAccess("/register", GUEST)).toBe("allow");
  });

  it("protected path redirects to login", () => {
    expect(resolveAccess("/dashboard", GUEST)).toBe("redirect-login");
    expect(resolveAccess("/reports", GUEST)).toBe("redirect-login");
    expect(resolveAccess("/admin", GUEST)).toBe("redirect-login");
  });

  it("login redirect URL encodes the original path", () => {
    const url = buildLoginRedirect("/reports/new");
    expect(url).toBe("/login?next=%2Freports%2Fnew");
  });
});

// ---------------------------------------------------------------------------
// Tests — access resolution for authenticated users
// ---------------------------------------------------------------------------

describe("web auth — authenticated access by role", () => {
  it("any authenticated user can access /dashboard", () => {
    expect(resolveAccess("/dashboard", makeSession("u@x.com", "user"))).toBe("allow");
    expect(resolveAccess("/dashboard", makeSession("u@x.com", "admin"))).toBe("allow");
  });

  it("regular user is blocked from admin routes", () => {
    expect(resolveAccess("/admin", makeSession("u@x.com", "user"))).toBe("redirect-home");
  });

  it("staff is blocked from admin routes", () => {
    expect(resolveAccess("/admin", makeSession("u@x.com", "staff"))).toBe("redirect-home");
  });

  it("admin can access admin routes", () => {
    expect(resolveAccess("/admin", makeSession("u@x.com", "admin"))).toBe("allow");
  });

  it("staff can access staff-guarded report management routes", () => {
    expect(resolveAccess("/reports/manage", makeSession("u@x.com", "staff"))).toBe("allow");
  });

  it("admin can access staff-guarded routes", () => {
    expect(resolveAccess("/reports/manage", makeSession("u@x.com", "admin"))).toBe("allow");
  });

  it("regular user is blocked from staff-guarded routes", () => {
    expect(resolveAccess("/reports/manage", makeSession("u@x.com", "user"))).toBe("redirect-home");
  });

  it("moderator is blocked from staff-guarded routes", () => {
    expect(resolveAccess("/reports/manage", makeSession("u@x.com", "moderator"))).toBe("redirect-home");
  });
});
