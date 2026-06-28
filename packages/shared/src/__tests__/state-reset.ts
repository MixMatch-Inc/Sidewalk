export type EntityTable = "reports" | "comments" | "sessions" | "notifications" | "users";

const SAFE_ORDER: EntityTable[] = ["comments", "notifications", "reports", "sessions", "users"];

export async function resetEntityState(
  exec: (sql: string) => Promise<void>,
  tables: EntityTable[] = SAFE_ORDER
): Promise<void> {
  for (const table of tables) {
    await exec(`DELETE FROM ${table}`);
  }
}

export async function seedMinimalState(exec: (sql: string) => Promise<void>): Promise<void> {
  await exec(`INSERT INTO users (id, email, role) VALUES ('u-seed', 'seed@test.local', 'user')`);
}

export async function fullReset(exec: (sql: string) => Promise<void>): Promise<void> {
  await resetEntityState(exec);
  await seedMinimalState(exec);
}
