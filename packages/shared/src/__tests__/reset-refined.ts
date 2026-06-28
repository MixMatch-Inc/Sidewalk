export type ModelTable =
  | "report_attachments" | "report_comments" | "reports"
  | "notifications" | "sessions" | "users";

const DELETE_ORDER: ModelTable[] = [
  "report_attachments", "report_comments", "reports",
  "notifications", "sessions", "users",
];

export async function refinedReset(
  exec: (sql: string) => Promise<void>,
  skipTables: ModelTable[] = []
): Promise<void> {
  const toDelete = DELETE_ORDER.filter((t) => !skipTables.includes(t));
  for (const table of toDelete) {
    await exec(`DELETE FROM ${table}`);
  }
}

export async function verifyClean(
  query: (sql: string) => Promise<Array<{ count: number }>>,
  tables: ModelTable[] = DELETE_ORDER
): Promise<void> {
  for (const table of tables) {
    const [{ count }] = await query(`SELECT COUNT(*) as count FROM ${table}`);
    if (count > 0) throw new Error(`Table ${table} not clean: ${count} rows remain`);
  }
}
