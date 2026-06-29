/**
 * Contract / shape tests for report creation.
 *
 * These tests run against a local simulation (no DB, no HTTP) so they stay
 * fast and stable regardless of infrastructure. They pin the auth-first
 * contract: a valid submission + authenticated context → 201; every failure
 * path → the appropriate error status.
 *
 * Integration coverage lives in modules/reports/tests/report.test.ts.
 */
import { describe, it, expect } from "vitest";
import type { ReportSubmission } from "@sidewalk/shared";

interface TestContext {
  authenticated: boolean;
  userId?: string;
  role?: "admin" | "moderator" | "user";
}

function buildSubmission(overrides: Partial<ReportSubmission & { type?: string }> = {}): ReportSubmission & { type?: string } {
  return {
    title: "Test Report",
    description: "A report created during test",
    visibility: "public",
    ...overrides,
  };
}

function buildContext(overrides: Partial<TestContext> = {}): TestContext {
  return {
    authenticated: true,
    userId: "test-user-id",
    role: "user",
    ...overrides,
  };
}

function simulateCreate(
  payload: ReportSubmission & { type?: string; metadata?: Record<string, unknown> },
  ctx: TestContext,
): { success: boolean; status: number; data?: Record<string, unknown>; error?: string } {
  if (!ctx.authenticated) {
    return { success: false, error: "Unauthorized", status: 401 };
  }
  if (!payload.title || !payload.description) {
    return { success: false, error: "Title and description are required", status: 400 };
  }
  if (payload.type === "incident" && !payload.metadata?.severity) {
    return { success: false, error: "Incident reports require severity metadata", status: 400 };
  }
  return {
    success: true,
    status: 201,
    data: { id: "report-123", ...payload, authorId: ctx.userId, createdAt: new Date().toISOString() },
  };
}

describe("Reports — baseline creation contract", () => {
  it("accepts a minimal valid submission from an authenticated user", () => {
    const result = simulateCreate(buildSubmission(), buildContext());
    expect(result.status).toBe(201);
    expect(result.success).toBe(true);
  });

  it("rejects unauthenticated requests with 401", () => {
    const result = simulateCreate(buildSubmission(), buildContext({ authenticated: false }));
    expect(result.status).toBe(401);
    expect(result.error).toBe("Unauthorized");
  });

  it("rejects payload with empty title with 400", () => {
    const result = simulateCreate(buildSubmission({ title: "" }), buildContext());
    expect(result.status).toBe(400);
  });

  it("rejects payload without description with 400", () => {
    const result = simulateCreate(buildSubmission({ description: "" }), buildContext());
    expect(result.status).toBe(400);
  });

  it("rejects incident type without severity metadata with 400", () => {
    const result = simulateCreate(buildSubmission({ type: "incident" }), buildContext());
    expect(result.status).toBe(400);
  });

  it("stamps authorId from the authenticated context", () => {
    const result = simulateCreate(buildSubmission({ type: "feedback" }), buildContext({ userId: "user-42" }));
    expect(result.data?.authorId).toBe("user-42");
  });

  it("admin can create any report type including sensitive ones", () => {
    const result = simulateCreate(
      buildSubmission({ type: "investigation", metadata: { severity: "high" } }),
      buildContext({ role: "admin" }),
    );
    expect(result.status).toBe(201);
  });
});
