import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, sessionStore, tokenStore } from "../app.js";

describe("auth regressions: session expiry/reset/tamper/concurrency", () => {
  it("session expiry: refresh fails with INVALID_TOKEN for unknown token", async () => {
    const res = await request(app).post("/auth/refresh").send({ refreshToken: "expired-or-unknown" });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_TOKEN");
  });

  it("password-reset expiry edge: consumed reset token cannot be reused", async () => {
    const reg = await request(app).post("/auth/register").send({ email: "reset-expiry@sidewalk.test", password: "password123" });
    const token = tokenStore.issue(reg.body.id, "reset");

    const first = await request(app).post("/auth/password-reset/complete").send({ token, password: "newpassword123" });
    expect(first.status).toBe(200);

    const second = await request(app).post("/auth/password-reset/complete").send({ token, password: "newpassword123" });
    expect(second.status).toBe(400);
    expect(second.body.code).toBe("INVALID_TOKEN");
  });

  it("tampered verification token is rejected", async () => {
    const res = await request(app).post("/auth/verify-email").send({ token: "tampered-token" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_TOKEN");
  });

  it("concurrent sessions: revoking one session keeps the other valid", async () => {
    const email = "concurrent-session@sidewalk.test";
    await request(app).post("/auth/register").send({ email, password: "password123" });
    const s1 = (await request(app).post("/auth/login").send({ email, password: "password123" })).body;
    const s2 = (await request(app).post("/auth/login").send({ email, password: "password123" })).body;

    await request(app).post("/auth/logout").set("Authorization", `Bearer ${s1.accessToken}`);

    expect(sessionStore.getBySessionId(s1.accessToken)).toBeUndefined();
    expect(sessionStore.getBySessionId(s2.accessToken)).toBeDefined();
  });
});
