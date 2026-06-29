/**
 * Hardened validation tests for report submission.
 *
 * These tests run the shared Zod schema (reportSubmissionSchema) so that
 * any change to the canonical validation rules is caught immediately.
 */
import { describe, it, expect } from "vitest";
import { reportSubmissionSchema } from "@sidewalk/shared";

describe("reportSubmissionSchema — input validation", () => {
  it("accepts a valid report body", () => {
    const result = reportSubmissionSchema.safeParse({
      title: "Broken street light",
      description: "Lamp post on Main St is out.",
      visibility: "public",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing title", () => {
    const result = reportSubmissionSchema.safeParse({
      description: "No title provided",
      visibility: "public",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = reportSubmissionSchema.safeParse({
      title: "",
      description: "Empty title",
      visibility: "public",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing description", () => {
    const result = reportSubmissionSchema.safeParse({
      title: "Valid title",
      visibility: "public",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid visibility value", () => {
    const result = reportSubmissionSchema.safeParse({
      title: "Valid title",
      description: "Valid description",
      visibility: "everyone",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-object input", () => {
    expect(reportSubmissionSchema.safeParse(null).success).toBe(false);
    expect(reportSubmissionSchema.safeParse("string").success).toBe(false);
    expect(reportSubmissionSchema.safeParse(42).success).toBe(false);
  });

  it("accepts private visibility", () => {
    const result = reportSubmissionSchema.safeParse({
      title: "Private report",
      description: "Internal only",
      visibility: "private",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional location field", () => {
    const result = reportSubmissionSchema.safeParse({
      title: "Located report",
      description: "Near the park",
      visibility: "public",
      location: "51.505,-0.09",
    });
    expect(result.success).toBe(true);
  });
});
