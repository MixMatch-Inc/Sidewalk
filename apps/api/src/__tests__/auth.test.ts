import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";

import { app, sessionStore, tokenStore } from "../app.js";

// ── password service ──────────────────────────────────────────────────────────
import { hashPassword, verifyPassword } from "../services/password.js";

describe("password service", () => {
  it("hashes a password and verifies it", async () => {
    const hash = await hashPassword("secret123");
    expect(hash).not.toBe("secret123");
    expect(await verifyPassword("secret123", hash)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("secret123");
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});

// ── account model ─────────────────────────────────────────────────────────────
import { toPublic } from "../models/account.js";
import type { Account } from "../models/account.js";

describe("account model", () => {
  const account: Account = {
    id: "1",
    email: "test@example.com",
    passwordHash: "$2a$12$hash",
    verified: false,
    role: "citizen",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01")
  };

  it("toPublic strips passwordHash", () => {
    const pub = toPublic(account);
    expect("passwordHash" in pub).toBe(false);
    expect(pub.email).toBe("test@example.com");
  });
});

// ── session store unit tests ──────────────────────────────────────────────────
import { MemorySessionStore } from "../services/sessionStore.js";

describe("MemorySessionStore", () => {
  let store: MemorySessionStore;

  beforeEach(() => {
    store = new MemorySessionStore();
  });

  it("creates and retrieves a session by sessionId", () => {
    const s = store.create("acc1");
    expect(store.getBySessionId(s.sessionId)).toEqual(s);
  });

  it("retrieves a session by refreshToken", () => {
    const s = store.create("acc1");
    expect(store.getByRefreshToken(s.refreshToken)).toEqual(s);
  });

  it("rotate issues new tokens and invalidates old refreshToken", () => {
    const s = store.create("acc1");
    const rotated = store.rotate(s.sessionId);
    expect(rotated.refreshToken).not.toBe(s.refreshToken);
    expect(store.getByRefreshToken(s.refreshToken)).toBeUndefined();
    expect(store.getByRefreshToken(rotated.refreshToken)).toBeDefined();
  });

  it("revoke removes the session", () => {
    const s = store.create("acc1");
    store.revoke(s.sessionId);
    expect(store.getBySessionId(s.sessionId)).toBeUndefined();
    expect(store.getByRefreshToken(s.refreshToken)).toBeUndefined();
  });

  it("revokeAll removes only sessions for the given account", () => {
    const s1 = store.create("acc1");
    const s2 = store.create("acc1");
    const s3 = store.create("acc2");
    store.revokeAll("acc1");
    expect(store.getBySessionId(s1.sessionId)).toBeUndefined();
    expect(store.getBySessionId(s2.sessionId)).toBeUndefined();
    expect(store.getBySessionId(s3.sessionId)).toBeDefined();
  });
});

// ── register endpoint ─────────────────────────────────────────────────────────

describe("POST /auth/register", () => {
  it("creates an account and returns 201", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "new@example.com", password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe("new@example.com");
    expect(res.body.verified).toBe(false);
    expect(res.body).not.toHaveProperty("passwordHash");
  });

  it("returns 400 for invalid payload", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "bad-email", password: "short" });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("returns 409 for duplicate email", async () => {
    await request(app).post("/auth/register").send({ email: "dup@example.com", password: "password123" });
    const res = await request(app).post("/auth/register").send({ email: "dup@example.com", password: "password123" });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("EMAIL_TAKEN");
  });
});

// ── login endpoint ────────────────────────────────────────────────────────────

describe("POST /auth/login", () => {
  it("returns accessToken and refreshToken on valid credentials", async () => {
    await request(app).post("/auth/register").send({ email: "login@example.com", password: "password123" });
    const res = await request(app).post("/auth/login").send({ email: "login@example.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(typeof res.body.accessToken).toBe("string");
    expect(typeof res.body.refreshToken).toBe("string");
    expect(res.body.account.email).toBe("login@example.com");
  });

  it("returns 401 for wrong password", async () => {
    const res = await request(app).post("/auth/login").send({ email: "login@example.com", password: "wrongpass" });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_CREDENTIALS");
  });

  it("returns 401 for unknown email", async () => {
    const res = await request(app).post("/auth/login").send({ email: "ghost@example.com", password: "password123" });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_CREDENTIALS");
  });
});

describe("auth privacy and latency baselines", () => {
  it("password reset request returns same status and shape for known/unknown accounts", async () => {
    await request(app).post("/auth/register").send({ email: "privacy-known@example.com", password: "password123" });

    const known = await request(app).post("/auth/password-reset/request").send({ email: "privacy-known@example.com" });
    const unknown = await request(app).post("/auth/password-reset/request").send({ email: "privacy-unknown@example.com" });

    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(known.body).toEqual(unknown.body);
  });

  it("login endpoint responds within demo budget under short burst traffic", async () => {
    await request(app).post("/auth/register").send({ email: "burst@example.com", password: "password123" });
    const start = Date.now();
    await Promise.all(
      Array.from({ length: 8 }, () =>
        request(app).post("/auth/login").send({ email: "burst@example.com", password: "password123" })
      )
    );
    const elapsedMs = Date.now() - start;
    expect(elapsedMs).toBeLessThan(2000);
  });
});

// ── refresh endpoint ──────────────────────────────────────────────────────────

describe("POST /auth/refresh", () => {
  async function loginUser(email: string): Promise<{ accessToken: string; refreshToken: string }> {
    await request(app).post("/auth/register").send({ email, password: "password123" });
    const res = await request(app).post("/auth/login").send({ email, password: "password123" });
    return res.body;
  }

  it("rotates tokens and returns new pair", async () => {
    const { refreshToken } = await loginUser("refresh1@example.com");
    const res = await request(app).post("/auth/refresh").send({ refreshToken });

    expect(res.status).toBe(200);
    expect(typeof res.body.accessToken).toBe("string");
    expect(typeof res.body.refreshToken).toBe("string");
    expect(res.body.refreshToken).not.toBe(refreshToken);
  });

  it("rejects a replayed (already-rotated) refresh token", async () => {
    const { refreshToken } = await loginUser("refresh2@example.com");
    await request(app).post("/auth/refresh").send({ refreshToken });
    const res = await request(app).post("/auth/refresh").send({ refreshToken });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_TOKEN");
  });

  it("returns 401 for an unknown refresh token", async () => {
    const res = await request(app).post("/auth/refresh").send({ refreshToken: "bogus" });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_TOKEN");
  });
});

// ── single-device logout ──────────────────────────────────────────────────────

describe("POST /auth/logout", () => {
  async function loginUser(email: string): Promise<{ accessToken: string; refreshToken: string }> {
    await request(app).post("/auth/register").send({ email, password: "password123" });
    const res = await request(app).post("/auth/login").send({ email, password: "password123" });
    return res.body;
  }

  it("revokes the current session and returns 200", async () => {
    const { accessToken } = await loginUser("logout1@example.com");
    const res = await request(app)
      .post("/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Session revoked.");
    expect(sessionStore.getBySessionId(accessToken)).toBeUndefined();
  });

  it("leaves other sessions intact", async () => {
    const email = "logout2@example.com";
    await request(app).post("/auth/register").send({ email, password: "password123" });
    const s1 = (await request(app).post("/auth/login").send({ email, password: "password123" })).body;
    const s2 = (await request(app).post("/auth/login").send({ email, password: "password123" })).body;

    await request(app).post("/auth/logout").set("Authorization", `Bearer ${s1.accessToken}`);

    expect(sessionStore.getBySessionId(s1.accessToken)).toBeUndefined();
    expect(sessionStore.getBySessionId(s2.accessToken)).toBeDefined();
  });

  it("returns 401 without Authorization header", async () => {
    const res = await request(app).post("/auth/logout");
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_TOKEN");
  });

  it("returns 404 for an already-revoked session", async () => {
    const { accessToken } = await loginUser("logout3@example.com");
    await request(app).post("/auth/logout").set("Authorization", `Bearer ${accessToken}`);
    const res = await request(app).post("/auth/logout").set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("SESSION_NOT_FOUND");
  });
});

// ── logout-all-sessions ───────────────────────────────────────────────────────

describe("POST /auth/logout/all", () => {
  it("revokes all sessions for the account", async () => {
    const email = "logoutall@example.com";
    await request(app).post("/auth/register").send({ email, password: "password123" });
    const s1 = (await request(app).post("/auth/login").send({ email, password: "password123" })).body;
    const s2 = (await request(app).post("/auth/login").send({ email, password: "password123" })).body;

    const res = await request(app)
      .post("/auth/logout/all")
      .set("Authorization", `Bearer ${s1.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("All sessions revoked.");
    expect(sessionStore.getBySessionId(s1.accessToken)).toBeUndefined();
    expect(sessionStore.getBySessionId(s2.accessToken)).toBeUndefined();
  });

  it("does not affect sessions of other accounts", async () => {
    const emailA = "logoutall-a@example.com";
    const emailB = "logoutall-b@example.com";
    await request(app).post("/auth/register").send({ email: emailA, password: "password123" });
    await request(app).post("/auth/register").send({ email: emailB, password: "password123" });
    const sA = (await request(app).post("/auth/login").send({ email: emailA, password: "password123" })).body;
    const sB = (await request(app).post("/auth/login").send({ email: emailB, password: "password123" })).body;

    await request(app).post("/auth/logout/all").set("Authorization", `Bearer ${sA.accessToken}`);

    expect(sessionStore.getBySessionId(sA.accessToken)).toBeUndefined();
    expect(sessionStore.getBySessionId(sB.accessToken)).toBeDefined();
  });

  it("returns 401 without Authorization header", async () => {
    const res = await request(app).post("/auth/logout/all");
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_TOKEN");
  });
});

// ── email verification ────────────────────────────────────────────────────────

describe("POST /auth/verify-email", () => {
  it("marks account verified with a valid token", async () => {
    const regRes = await request(app).post("/auth/register").send({ email: "verify2@example.com", password: "password123" });
    const vToken = tokenStore.issue(regRes.body.id, "verify");

    const res = await request(app).post("/auth/verify-email").send({ token: vToken });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Email verified.");
  });

  it("rejects an invalid token", async () => {
    const res = await request(app).post("/auth/verify-email").send({ token: "bogus" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_TOKEN");
  });

  it("rejects a replayed token", async () => {
    const regRes = await request(app).post("/auth/register").send({ email: "verify3@example.com", password: "password123" });
    const vToken = tokenStore.issue(regRes.body.id, "verify");
    await request(app).post("/auth/verify-email").send({ token: vToken });
    const res = await request(app).post("/auth/verify-email").send({ token: vToken });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_TOKEN");
  });
});

// ── password reset request ────────────────────────────────────────────────────

describe("POST /auth/password-reset/request", () => {
  it("returns privacy-safe response for a known email", async () => {
    await request(app).post("/auth/register").send({ email: "reset1@example.com", password: "password123" });
    const res = await request(app).post("/auth/password-reset/request").send({ email: "reset1@example.com" });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reset link/i);
  });

  it("returns the same response for an unknown email", async () => {
    const res = await request(app).post("/auth/password-reset/request").send({ email: "ghost@example.com" });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reset link/i);
  });

  it("returns 400 for invalid email", async () => {
    const res = await request(app).post("/auth/password-reset/request").send({ email: "not-an-email" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });
});

// ── password reset completion ─────────────────────────────────────────────────

describe("POST /auth/password-reset/complete", () => {
  async function setupReset(email: string): Promise<{ accountId: string; resetToken: string }> {
    const regRes = await request(app).post("/auth/register").send({ email, password: "oldpass123" });
    const accountId = regRes.body.id;
    const resetToken = tokenStore.issue(accountId, "reset");
    return { accountId, resetToken };
  }

  it("updates password and revokes sessions on success", async () => {
    const email = "complete1@example.com";
    const { resetToken } = await setupReset(email);
    const loginRes = await request(app).post("/auth/login").send({ email, password: "oldpass123" });
    const { accessToken } = loginRes.body;

    const res = await request(app).post("/auth/password-reset/complete").send({ token: resetToken, password: "newpass456" });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/log in again/i);

    // Old session should be revoked
    expect(sessionStore.getBySessionId(accessToken)).toBeUndefined();

    // New password should work
    const newLogin = await request(app).post("/auth/login").send({ email, password: "newpass456" });
    expect(newLogin.status).toBe(200);
  });

  it("rejects an invalid token", async () => {
    const res = await request(app).post("/auth/password-reset/complete").send({ token: "bogus", password: "newpass456" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_TOKEN");
  });

  it("rejects a replayed token", async () => {
    const { resetToken } = await setupReset("complete2@example.com");
    await request(app).post("/auth/password-reset/complete").send({ token: resetToken, password: "newpass456" });
    const res = await request(app).post("/auth/password-reset/complete").send({ token: resetToken, password: "anotherpass" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_TOKEN");
  });

  it("rejects a verify token used on the reset endpoint", async () => {
    const regRes = await request(app).post("/auth/register").send({ email: "complete3@example.com", password: "password123" });
    const wrongToken = tokenStore.issue(regRes.body.id, "verify");
    const res = await request(app).post("/auth/password-reset/complete").send({ token: wrongToken, password: "newpass456" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_TOKEN");
  });
});

describe("POST /auth/dev/seed-user", () => {
  it("is blocked outside development shortcut mode", async () => {
    const res = await request(app)
      .post("/auth/dev/seed-user")
      .send({ email: "devseed@example.com", password: "password123" });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });
});

describe("refresh-token reuse signal", () => {
  it("treats rotated refresh reuse as invalid token", async () => {
    await request(app).post("/auth/register").send({ email: "reuse@example.com", password: "password123" });
    const login = await request(app).post("/auth/login").send({ email: "reuse@example.com", password: "password123" });
    const firstRefresh = login.body.refreshToken;

    const rotate = await request(app).post("/auth/refresh").send({ refreshToken: firstRefresh });
    expect(rotate.status).toBe(200);

    const replay = await request(app).post("/auth/refresh").send({ refreshToken: firstRefresh });
    expect(replay.status).toBe(401);
    expect(replay.body.code).toBe("INVALID_TOKEN");
  });
});

// ── rate limiting ─────────────────────────────────────────────────────────────

import { makeRateLimiter } from "../middleware/authRateLimit.js";
import type { Request, Response } from "express";

describe("auth rate limiting", () => {
  function makeReq(ip = "1.2.3.4"): Request {
    return { ip } as unknown as Request;
  }

  function makeRes() {
    const res = { statusCode: 200, body: undefined as unknown } as {
      statusCode: number;
      body: unknown;
      status: (n: number) => { json: (b: unknown) => void };
    };
    res.status = (n: number) => {
      res.statusCode = n;
      return { json: (b: unknown) => { res.body = b; } };
    };
    return res;
  }

  it("allows requests under the limit", () => {
    const limiter = makeRateLimiter(3, 60_000);
    for (let i = 0; i < 3; i++) {
      let passed = false;
      limiter(makeReq(), makeRes() as unknown as Response, () => { passed = true; });
      expect(passed).toBe(true);
    }
  });

  it("blocks requests over the limit", () => {
    const limiter = makeRateLimiter(3, 60_000);
    for (let i = 0; i < 3; i++) {
      limiter(makeReq(), makeRes() as unknown as Response, () => {});
    }
    const res = makeRes();
    limiter(makeReq(), res as unknown as Response, () => {});
    expect(res.statusCode).toBe(429);
    expect((res.body as { code: string }).code).toBe("RATE_LIMITED");
  });

  it("tracks different IPs independently", () => {
    const limiter = makeRateLimiter(2, 60_000);
    limiter(makeReq("10.0.0.1"), makeRes() as unknown as Response, () => {});
    limiter(makeReq("10.0.0.1"), makeRes() as unknown as Response, () => {});
    // 10.0.0.1 is now at limit; 10.0.0.2 should still pass
    let passed = false;
    limiter(makeReq("10.0.0.2"), makeRes() as unknown as Response, () => { passed = true; });
    expect(passed).toBe(true);
  });
});

// ── suspicious login logger ───────────────────────────────────────────────────

import { MemorySuspiciousLoginLogger } from "../services/suspiciousLogin.js";

describe("MemorySuspiciousLoginLogger", () => {
  it("records a suspicious event and returns it via getAll", () => {
    const logger = new MemorySuspiciousLoginLogger();
    const event = { timestamp: new Date().toISOString(), email: "a@b.com", ip: "1.2.3.4", reason: "INVALID_CREDENTIALS" as const };
    logger.record(event);
    expect(logger.getAll()).toHaveLength(1);
    expect(logger.getAll()[0]).toEqual(event);
  });

  it("does not include passwords or tokens in the event shape", () => {
    const logger = new MemorySuspiciousLoginLogger();
    const event = { timestamp: new Date().toISOString(), email: "a@b.com", ip: "1.2.3.4", reason: "ACCOUNT_LOCKED" as const };
    logger.record(event);
    const recorded = logger.getAll()[0];
    expect(recorded).not.toHaveProperty("password");
    expect(recorded).not.toHaveProperty("token");
  });
});

// ── lockout service ───────────────────────────────────────────────────────────

import { LockoutService } from "../services/lockout.js";

describe("LockoutService", () => {
  it("is not locked before any failures", () => {
    const svc = new LockoutService({ maxFailures: 3, durationMs: 60_000 });
    expect(svc.isLocked("acc1")).toBe(false);
  });

  it("locks after maxFailures consecutive failures", () => {
    const svc = new LockoutService({ maxFailures: 3, durationMs: 60_000 });
    svc.recordFailure("acc1");
    svc.recordFailure("acc1");
    expect(svc.isLocked("acc1")).toBe(false);
    svc.recordFailure("acc1");
    expect(svc.isLocked("acc1")).toBe(true);
  });

  it("clears lockout after durationMs has elapsed", async () => {
    const svc = new LockoutService({ maxFailures: 2, durationMs: 50 });
    svc.recordFailure("acc1");
    svc.recordFailure("acc1");
    expect(svc.isLocked("acc1")).toBe(true);
    await new Promise((r) => setTimeout(r, 60));
    expect(svc.isLocked("acc1")).toBe(false);
  });

  it("resets failure counter on success", () => {
    const svc = new LockoutService({ maxFailures: 3, durationMs: 60_000 });
    svc.recordFailure("acc1");
    svc.recordFailure("acc1");
    svc.recordSuccess("acc1");
    svc.recordFailure("acc1"); // only 1 failure after reset
    expect(svc.isLocked("acc1")).toBe(false);
  });
});

// ── login lockout integration ─────────────────────────────────────────────────

import { suspiciousLoginLogger } from "../app.js";

describe("login lockout and suspicious event logging", () => {
  const email = "lockout@example.com";

  it("records INVALID_CREDENTIALS event on bad password", async () => {
    await request(app).post("/auth/register").send({ email: "spy@example.com", password: "password123" });
    const before = suspiciousLoginLogger.getAll().length;
    await request(app).post("/auth/login").send({ email: "spy@example.com", password: "wrongpass" });
    const events = suspiciousLoginLogger.getAll();
    expect(events.length).toBe(before + 1);
    expect(events[events.length - 1].reason).toBe("INVALID_CREDENTIALS");
    expect(events[events.length - 1].email).toBe("spy@example.com");
    expect(events[events.length - 1]).not.toHaveProperty("password");
  });

  it("returns 403 ACCOUNT_LOCKED after threshold failures and logs the event", async () => {
    await request(app).post("/auth/register").send({ email, password: "password123" });
    // Exhaust the 3-failure test threshold
    await request(app).post("/auth/login").send({ email, password: "bad" });
    await request(app).post("/auth/login").send({ email, password: "bad" });
    await request(app).post("/auth/login").send({ email, password: "bad" });

    const res = await request(app).post("/auth/login").send({ email, password: "password123" });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("ACCOUNT_LOCKED");

    const events = suspiciousLoginLogger.getAll();
    const lockEvent = events.find((e) => e.reason === "ACCOUNT_LOCKED" && e.email === email);
    expect(lockEvent).toBeDefined();
  });
});

// ── auth response envelope (issue #331) ──────────────────────────────────────

describe("auth response envelope shape", () => {
  it("register returns id, email, verified, createdAt", async () => {
    const res = await request(app).post("/auth/register").send({ email: "env1@example.com", password: "password123" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ email: "env1@example.com", verified: false });
    expect(typeof res.body.id).toBe("string");
    expect(typeof res.body.createdAt).toBe("string");
    expect(res.body).not.toHaveProperty("passwordHash");
  });

  it("login returns accessToken, refreshToken, and account basics", async () => {
    await request(app).post("/auth/register").send({ email: "env2@example.com", password: "password123" });
    const res = await request(app).post("/auth/login").send({ email: "env2@example.com", password: "password123" });
    expect(res.status).toBe(200);
    expect(typeof res.body.accessToken).toBe("string");
    expect(typeof res.body.refreshToken).toBe("string");
    expect(res.body.account).toMatchObject({ email: "env2@example.com", verified: false });
    expect(res.body.account).not.toHaveProperty("passwordHash");
  });
});

// ── auth metrics (issue #341) ─────────────────────────────────────────────────

import { resetMetrics } from "../app.js";

describe("GET /auth/metrics", () => {
  beforeEach(() => resetMetrics());

  it("returns empty counters before any auth activity", async () => {
    const res = await request(app).get("/auth/metrics");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("counters");
    expect(res.body).toHaveProperty("avg_duration_ms");
  });

  it("increments register.success after a successful registration", async () => {
    await request(app).post("/auth/register").send({ email: "metrics1@example.com", password: "password123" });
    const res = await request(app).get("/auth/metrics");
    expect(res.body.counters["auth.register.success"]).toBe(1);
  });

  it("increments register.failure on duplicate email", async () => {
    await request(app).post("/auth/register").send({ email: "metrics2@example.com", password: "password123" });
    await request(app).post("/auth/register").send({ email: "metrics2@example.com", password: "password123" });
    const res = await request(app).get("/auth/metrics");
    expect(res.body.counters["auth.register.failure"]).toBeGreaterThanOrEqual(1);
  });

  it("increments login.success and login.failure", async () => {
    await request(app).post("/auth/register").send({ email: "metrics3@example.com", password: "password123" });
    await request(app).post("/auth/login").send({ email: "metrics3@example.com", password: "password123" });
    await request(app).post("/auth/login").send({ email: "metrics3@example.com", password: "wrong" });
    const res = await request(app).get("/auth/metrics");
    expect(res.body.counters["auth.login.success"]).toBe(1);
    expect(res.body.counters["auth.login.failure"]).toBeGreaterThanOrEqual(1);
  });

  it("records avg_duration_ms for instrumented endpoints", async () => {
    await request(app).post("/auth/register").send({ email: "metrics4@example.com", password: "password123" });
    const res = await request(app).get("/auth/metrics");
    expect(typeof res.body.avg_duration_ms["register"]).toBe("number");
  });
});
