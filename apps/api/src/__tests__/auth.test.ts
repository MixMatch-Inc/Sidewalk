import { describe, it, expect } from "vitest";
import request from "supertest";

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

// ── register endpoint ─────────────────────────────────────────────────────────
import { app } from "../app.js";

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
  it("returns token on valid credentials", async () => {
    await request(app).post("/auth/register").send({ email: "login@example.com", password: "password123" });
    const res = await request(app).post("/auth/login").send({ email: "login@example.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
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
