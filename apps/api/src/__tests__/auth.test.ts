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
    const { accountId, resetToken } = await setupReset(email);
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
    expect((res.body as any).code).toBe("RATE_LIMITED");
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
