import { describe, it, expect } from "vitest";

interface ApiResponse<T> { data?: T; error?: string; status: number; }

function ok<T>(data: T): ApiResponse<T> { return { data, status: 200 }; }
function err(msg: string, status = 400): ApiResponse<never> { return { error: msg, status }; }
function unauth(): ApiResponse<never> { return { error: "Unauthorized", status: 401 }; }

describe("API — baseline tests", () => {
  it("ok response has status 200", () => {
    expect(ok({ id: "1" }).status).toBe(200);
  });

  it("error response carries message", () => {
    expect(err("bad input").error).toBe("bad input");
  });

  it("unauth response has status 401", () => {
    expect(unauth().status).toBe(401);
  });

  it("ok response does not have error field", () => {
    expect(ok({}).error).toBeUndefined();
  });
});
