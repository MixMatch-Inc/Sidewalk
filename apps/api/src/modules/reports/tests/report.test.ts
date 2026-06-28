import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "../../../shared/database/prisma.js";
import { reportService } from "../services/report.service.js";

let testUserId: string;

beforeEach(async () => {
  // Clean up and create a fresh test user before each test
  await prisma.moderation.deleteMany();
  await prisma.reportMedia.deleteMany();
  await prisma.report.deleteMany();
  await prisma.user.deleteMany({ where: { email: "test@sidewalk.dev" } });

  const user = await prisma.user.create({
    data: { email: "test@sidewalk.dev", passwordHash: "x", displayName: "Tester" },
  });
  testUserId = user.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

const mockUser = () => ({ sub: testUserId });

describe("reportService", () => {
  it("creates a report with draft status", async () => {
    const report = await reportService.create(
      { title: "Test", description: "Desc", visibility: "public" },
      mockUser(),
    );
    expect(report.id).toBeDefined();
    expect(report.status).toBe("draft");
    expect(report.authorId).toBe(testUserId);
  });

  it("finds a report by id", async () => {
    const created = await reportService.create(
      { title: "Test", description: "Desc", visibility: "public" },
      mockUser(),
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
      mockUser(),
    );
    const { total } = await reportService.list({ authorId: testUserId });
    expect(total).toBeGreaterThanOrEqual(1);
  });
});
