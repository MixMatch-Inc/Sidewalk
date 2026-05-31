/**
 * Tests for POST /wallet/bootstrap — Issues #417 and #419
 *
 * The API session check is intercepted via vi.stubGlobal("fetch", ...) so
 * these tests run without a live API instance.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import { makeRequireAuth } from "../middleware/requireAuth.js";
import { makeWalletRouter } from "../routes/wallet.js";

function buildApp(fetchImpl: typeof fetch) {
  vi.stubGlobal("fetch", fetchImpl);
  const app = express();
  app.use(express.json());
  const requireAuth = makeRequireAuth("http://api.internal");
  app.use("/wallet", makeWalletRouter(requireAuth));
  return app;
}

// Helpers to build mock fetch responses
function mockFetch(sessionsOk: boolean, meVerified: boolean | null) {
  return vi.fn(async (url: string, opts?: RequestInit) => {
    const u = String(url);
    if (u.endsWith("/auth/sessions")) {
      if (!sessionsOk) return new Response(null, { status: 401 });
      return new Response(JSON.stringify([{ sessionId: "abc123" }]), { status: 200 });
    }
    if (u.endsWith("/auth/me")) {
      if (meVerified === null) return new Response(null, { status: 404 });
      return new Response(JSON.stringify({ id: "user-1", verified: meVerified }), { status: 200 });
    }
    return new Response(null, { status: 404 });
  }) as unknown as typeof fetch;
}

describe("POST /wallet/bootstrap", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 401 when Authorization header is missing", async () => {
    const app = buildApp(mockFetch(true, true));
    const res = await request(app).post("/wallet/bootstrap");
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_TOKEN");
  });

  it("returns 401 when session is not found / revoked", async () => {
    const app = buildApp(mockFetch(false, null));
    const res = await request(app)
      .post("/wallet/bootstrap")
      .set("Authorization", "Bearer revoked-token");
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("SESSION_NOT_FOUND");
  });

  it("returns 403 when account is not verified", async () => {
    const app = buildApp(mockFetch(true, false));
    const res = await request(app)
      .post("/wallet/bootstrap")
      .set("Authorization", "Bearer unverified-token");
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("ACCOUNT_UNVERIFIED");
  });

  it("returns 403 when /auth/me is unavailable (conservative fallback)", async () => {
    // /auth/me returns 404 → verified status unknown → deny
    const app = buildApp(mockFetch(true, null));
    const res = await request(app)
      .post("/wallet/bootstrap")
      .set("Authorization", "Bearer session-no-me");
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("ACCOUNT_UNVERIFIED");
  });

  it("returns 202 and emits audit log for a verified, active session", async () => {
    const app = buildApp(mockFetch(true, true));
    const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    const res = await request(app)
      .post("/wallet/bootstrap")
      .set("Authorization", "Bearer valid-token")
      .set("x-request-id", "req-abc");

    expect(res.status).toBe(202);
    expect(res.body.message).toMatch(/bootstrap initiated/i);

    // Audit event was emitted
    expect(consoleSpy).toHaveBeenCalledOnce();
    const logged = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(logged.event).toBe("stellar.audit");
    expect(logged.action).toBe("wallet_bootstrap");
    expect(logged.outcome).toBe("success");
    expect(logged.accountId).toBe("user-1");
    expect(logged.requestId).toBe("req-abc");

    consoleSpy.mockRestore();
  });
});
