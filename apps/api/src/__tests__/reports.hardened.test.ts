import { describe, it, expect } from "vitest";

interface ReportBody { title: string; description: string; }

function validateReport(body: unknown): body is ReportBody {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return typeof b.title === "string" && b.title.length > 0
      && typeof b.description === "string";
}

describe("API — baseline report creation tests", () => {
  it("accepts a valid report body", () => {
    expect(validateReport({ title: "Broken light", description: "Lamp post out" })).toBe(true);
  });

  it("rejects missing title", () => {
    expect(validateReport({ description: "no title" })).toBe(false);
  });

  it("rejects empty title", () => {
    expect(validateReport({ title: "", description: "empty" })).toBe(false);
  });

  it("rejects non-object input", () => {
    expect(validateReport(null)).toBe(false);
    expect(validateReport("string")).toBe(false);
  });
});
