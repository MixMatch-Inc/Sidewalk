export interface CivicTestUser { id: string; email: string; role: "resident" | "staff" | "admin"; }
export interface CivicTestReport { id: string; authorId: string; category: string; status: string; }

export function makeCivicUser(overrides: Partial<CivicTestUser> = {}): CivicTestUser {
  return { id: "civic-user-1", email: "resident@civic.test", role: "resident", ...overrides };
}

export function makeCivicReport(overrides: Partial<CivicTestReport> = {}): CivicTestReport {
  return { id: "civic-report-1", authorId: "civic-user-1", category: "infrastructure", status: "open", ...overrides };
}

export function civicAuthHeader(token = "civic-test-token"): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export function assertCivicShape(obj: unknown, requiredKeys: string[]): void {
  for (const key of requiredKeys) {
    if (!(key in (obj as Record<string, unknown>))) {
      throw new Error(`Missing required key: ${key}`);
    }
  }
}
