export type DomainTable = "reports" | "comments" | "sessions" | "users";

const ORDERED: DomainTable[] = ["comments", "reports", "sessions", "users"];

export async function resetDomain(
  exec: (sql: string) => Promise<void>,
  tables: DomainTable[] = ORDERED
): Promise<void> {
  for (const t of tables) {
    await exec(`DELETE FROM ${t}`);
  }
}

export function assertCleanState(counts: Record<DomainTable, number>): void {
  for (const [table, count] of Object.entries(counts)) {
    if (count !== 0) throw new Error(`Expected ${table} to be empty, got ${count} rows`);
  }
}
