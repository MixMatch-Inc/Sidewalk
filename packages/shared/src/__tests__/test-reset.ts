/**
 * Canonical test-database reset for the API integration tests.
 *
 * Deletion order respects FK constraints defined in the Prisma schema:
 *   Moderation / ReportMedia / AuditEvent → Report → User
 *
 * Pass the PrismaClient instance from the calling test file.
 * The type is kept structurally loose so this file doesn't need to import
 * the Prisma client directly (it lives in apps/api, not in this package).
 */

export interface PrismaLike {
  moderation: { deleteMany: (args?: object) => Promise<unknown> };
  reportMedia: { deleteMany: (args?: object) => Promise<unknown> };
  auditEvent: { deleteMany: (args?: object) => Promise<unknown> };
  report: { deleteMany: (args?: object) => Promise<unknown> };
  user: { deleteMany: (args?: object) => Promise<unknown> };
}

/** Delete all rows in safe FK order. Suitable for beforeEach teardown. */
export async function resetAll(prisma: PrismaLike): Promise<void> {
  await prisma.moderation.deleteMany();
  await prisma.reportMedia.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.report.deleteMany();
  await prisma.user.deleteMany();
}

/** Delete only report-related rows; leave users intact. */
export async function resetReports(prisma: PrismaLike): Promise<void> {
  await prisma.moderation.deleteMany();
  await prisma.reportMedia.deleteMany();
  await prisma.report.deleteMany();
}

export interface SeedUserInput {
  email: string;
  passwordHash: string;
  displayName?: string;
}

/** Seed a minimal user after a reset. Returns the created user's id. */
export async function seedUser(
  prisma: { user: { create: (args: object) => Promise<{ id: string }> } },
  input: SeedUserInput,
): Promise<string> {
  const user = await prisma.user.create({ data: input });
  return user.id;
}
