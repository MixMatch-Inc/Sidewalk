export interface ResetOptions { seedAuth?: boolean; seedReports?: boolean; }

export async function hardReset(
  prisma: { $executeRawUnsafe: (q: string) => Promise<unknown> },
  opts: ResetOptions = {}
): Promise<void> {
  await prisma.$executeRawUnsafe("DELETE FROM reports");
  await prisma.$executeRawUnsafe("DELETE FROM sessions");
  if (!opts.seedAuth) return;
  await prisma.$executeRawUnsafe(
    "INSERT INTO users (id, email, role) VALUES ('seed-user', 'seed@test.com', 'user')"
  );
  if (opts.seedReports) {
    await prisma.$executeRawUnsafe(
      "INSERT INTO reports (id, authorId, title) VALUES ('seed-report', 'seed-user', 'Seed')"
    );
  }
}
