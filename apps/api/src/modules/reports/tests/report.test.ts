import { describe, it, expect, vi, beforeEach } from "vitest";
import { reportService } from "../services/report.service.js";

const mockUser = { sub: "user-1" };

beforeEach(() => {
  for (const key of (reportService as any).reports?.keys() ?? []) {
    (reportService as any).reports?.delete(key);
  }
});

describe("reportService", () => {
  it("creates a report with draft status", async () => {
    const report = await reportService.create(
      { title: "Test", description: "Desc", visibility: "public" },
      mockUser,
    );
    expect(report.id).toBeDefined();
    expect(report.status).toBe("draft");
    expect(report.authorId).toBe("user-1");
  });

  it("finds a report by id", async () => {
    const created = await reportService.create(
      { title: "Test", description: "Desc", visibility: "public" },
      mockUser,
    );
    const found = await reportService.findById(created.id);
    expect(found.id).toBe(created.id);
  });

  it("throws when report not found", async () => {
    await expect(reportService.findById("nonexistent")).rejects.toThrow();
  });

  it("lists reports with optional filters", async () => {
    await reportService.create(
      { title: "A", description: "D1", visibility: "public" },
      mockUser,
    );
    const { total } = await reportService.list({ authorId: "user-1" });
    expect(total).toBeGreaterThanOrEqual(1);
  });
});
