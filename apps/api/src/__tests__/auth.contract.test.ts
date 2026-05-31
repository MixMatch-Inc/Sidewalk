import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../app.js";

describe("auth contract: status + session endpoints", () => {
  it("GET /auth/status returns stable shape", async () => {
    const res = await request(app).get("/auth/status");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      phase: expect.any(String),
      ready: expect.any(Boolean),
      nextStep: expect.any(String),
    });
  });

  it("POST /auth/refresh returns contract error shape for invalid token", async () => {
    const res = await request(app).post("/auth/refresh").send({ refreshToken: "invalid-token" });
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      code: "INVALID_TOKEN",
      message: expect.any(String),
    });
  });
});
