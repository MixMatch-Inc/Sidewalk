export interface ModuleTestContext {
  userId: string;
  token: string;
  baseUrl: string;
}

export function createTestContext(overrides: Partial<ModuleTestContext> = {}): ModuleTestContext {
  return {
    userId: "test-user",
    token: "test-token",
    baseUrl: "http://localhost:3001",
    ...overrides,
  };
}

export async function withTestContext<T>(
  fn: (ctx: ModuleTestContext) => Promise<T>,
  overrides: Partial<ModuleTestContext> = {}
): Promise<T> {
  const ctx = createTestContext(overrides);
  return fn(ctx);
}

export function authHeaders(ctx: ModuleTestContext): Record<string, string> {
  return { Authorization: `Bearer ${ctx.token}`, "Content-Type": "application/json" };
}
