export type TableName = "reports" | "sessions" | "users" | "notifications";

const RESET_ORDER: TableName[] = ["reports", "notifications", "sessions", "users"];

export async function resetTables(
  exec: (sql: string) => Promise<void>,
  tables: TableName[] = RESET_ORDER
): Promise<void> {
  for (const table of tables) {
    await exec(`DELETE FROM ${table}`);
  }
}

export async function resetAndSeed(
  exec: (sql: string) => Promise<void>,
  seedSql: string[]
): Promise<void> {
  await resetTables(exec);
  for (const sql of seedSql) {
    await exec(sql);
  }
}
