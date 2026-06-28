import { describe, it, expect } from "vitest";

interface ReportPayload {
  type: string;
  title: string;
  description: string;
  createdBy?: string;
  metadata?: Record<string, unknown>;
}

interface TestContext {
  authenticated: boolean;
  userId?: string;
  role?: "admin" | "moderator" | "user";
}

function buildReportPayload(overrides: Partial<ReportPayload> = {}): ReportPayload {
  return {
    type: "incident",
    title: "Test Report",
    description: "A report created during test",
    ...overrides,
  };
}

function createTestContext(overrides: Partial<TestContext> = {}): TestContext {
  return {
    authenticated: true,
    userId: "test-user-id",
    role: "user",
    ...overrides,
  };
}

function simulateReportCreation(payload: ReportPayload, ctx: TestContext) {
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
    data: { id: "report-123", ...payload, createdBy: ctx.userId, createdAt: new Date().toISOString() },
    status: 201,
  };
}

describe("Reports — baseline API tests", () => {
  it("creates a report with minimal valid payload", () => {
    const payload = buildReportPayload();
    const ctx = createTestContext();
    const result = simulateReportCreation(payload, ctx);
    expect(result.status).toBe(201);
    expect(result.success).toBe(true);
  });

  it("rejects unauthenticated requests", () => {
    const payload = buildReportPayload();
    const ctx = createTestContext({ authenticated: false });
    const result = simulateReportCreation(payload, ctx);
    expect(result.status).toBe(401);
  });

  it("rejects payload without title", () => {
    const payload = buildReportPayload({ title: "" });
    const ctx = createTestContext();
    const result = simulateReportCreation(payload, ctx);
    expect(result.status).toBe(400);
  });

  it("rejects incident report without severity", () => {
    const payload = buildReportPayload({ type: "incident" });
    const ctx = createTestContext();
    const result = simulateReportCreation(payload, ctx);
    expect(result.status).toBe(400);
  });

  it("includes createdBy from authenticated context", () => {
    const payload = buildReportPayload({ type: "feedback" });
    const ctx = createTestContext({ userId: "user-42" });
    const result = simulateReportCreation(payload, ctx);
    expect(result.data.createdBy).toBe("user-42");
  });

  it("admin role can create sensitive report types", () => {
    const payload = buildReportPayload({
      type: "investigation",
      metadata: { severity: "high" },
    });
    const ctx = createTestContext({ role: "admin" });
    const result = simulateReportCreation(payload, ctx);
    expect(result.status).toBe(201);
  });

  it("buildReportPayload applies overrides correctly", () => {
    const payload = buildReportPayload({ title: "Custom Title" });
    expect(payload.title).toBe("Custom Title");
    expect(payload.type).toBe("incident");
  });

  it("createTestContext defaults to authenticated user", () => {
    const ctx = createTestContext();
    expect(ctx.authenticated).toBe(true);
    expect(ctx.role).toBe("user");
  });
});
