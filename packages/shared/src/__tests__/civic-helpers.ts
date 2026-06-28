export interface TestUser { id: string; email: string; role?: string; }
export interface TestReport { id: string; authorId: string; title: string; status?: string; }

export function makeUser(overrides: Partial<TestUser> = {}): TestUser {
  return { id: "test-user-id", email: "test@civic.local", role: "user", ...overrides };
}

export function makeReport(overrides: Partial<TestReport> = {}): TestReport {
  return { id: "test-report-id", authorId: "test-user-id", title: "Test Report", status: "open", ...overrides };
}

export function makeAuthHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export const TEST_TOKENS = {
  user:  "test.user.token",
  admin: "test.admin.token",
  anon:  "",
} as const;
