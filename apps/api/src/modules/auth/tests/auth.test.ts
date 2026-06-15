import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";

import { app } from "../../../app.js";
import { prisma } from "../../../shared/database/prisma.js";

describe("POST /api/auth/register", () => {
  it("creates a new account", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "new-user@example.com", password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ email: "new-user@example.com" });
    expect(res.body.id).toBeTruthy();
    expect(res.body).not.toHaveProperty("passwordHash");
  });

  it("rejects a duplicate email", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "duplicate@example.com", password: "password123" });

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "duplicate@example.com", password: "password123" });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("CONFLICT");
  });

  it("rejects invalid input", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "not-an-email", password: "short" });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with valid credentials", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "login-user@example.com", password: "password123" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "login-user@example.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user).toMatchObject({ email: "login-user@example.com" });
  });

  it("rejects an invalid password", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "wrong-password@example.com", password: "password123" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "wrong-password@example.com", password: "wrong-password" });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("UNAUTHORIZED");
  });

  it("rejects a non-existent account", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "does-not-exist@example.com", password: "password123" });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("UNAUTHORIZED");
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
