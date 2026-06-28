/**
 * Seed script — idempotent upsert-based fixtures for local development.
 * Run: pnpm --filter @sidewalk/api db:seed
 *      (or automatically via prisma db seed)
 */
import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hash(pw: string) {
  return bcrypt.hash(pw, 10);
}

async function main() {
  // ------------------------------------------------------------------
  // Users
  // ------------------------------------------------------------------
  const userSeeds = [
    { email: "admin@sidewalk.dev", displayName: "Admin User" },
    { email: "alice@sidewalk.dev", displayName: "Alice" },
    { email: "bob@sidewalk.dev", displayName: "Bob" },
    { email: "carol@sidewalk.dev", displayName: "Carol" },
    { email: "dave@sidewalk.dev", displayName: "Dave" },
  ];

  const users = await Promise.all(
    userSeeds.map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        create: { email: u.email, passwordHash: "", displayName: u.displayName },
        update: {},
      })
    )
  );

  // Ensure password hashes are set (skipped on update to keep idempotent)
  await Promise.all(
    users.map(async (u) => {
      if (!u.passwordHash) {
        const pw = await hash("password123");
        await prisma.user.update({ where: { id: u.id }, data: { passwordHash: pw } });
      }
    })
  );

  const [admin, alice, bob, carol] = users;

  // ------------------------------------------------------------------
  // Reports (one model covering draft → submitted → resolved lifecycle)
  // ------------------------------------------------------------------
  const reportSeeds = [
    { authorId: alice.id, title: "Pothole on Elm Street",       description: "Large pothole near the bus stop.", status: "submitted",   visibility: "public" },
    { authorId: alice.id, title: "Broken street light",         description: "Light out on corner of Oak Ave.",  status: "under_review", visibility: "public" },
    { authorId: bob.id,   title: "Graffiti on park bench",      description: "Tagging on the south bench.",       status: "draft",        visibility: "private" },
    { authorId: bob.id,   title: "Overflowing litter bin",      description: "Bin by playground overflowing.",   status: "submitted",   visibility: "public" },
    { authorId: carol.id, title: "Flooding in underpass",       description: "Water pooling after rain.",         status: "resolved",    visibility: "public" },
    { authorId: carol.id, title: "Damaged pedestrian crossing", description: "Paint worn off on Main St.",        status: "closed",      visibility: "public" },
    { authorId: admin.id, title: "Missing road sign",           description: "Speed limit sign knocked down.",   status: "submitted",   visibility: "public" },
  ];

  const reports = await Promise.all(
    reportSeeds.map((r) =>
      prisma.report.upsert({
        where: { id: `seed-report-${reportSeeds.indexOf(r) + 1}` },
        create: { id: `seed-report-${reportSeeds.indexOf(r) + 1}`, ...r },
        update: {},
      })
    )
  );

  // ------------------------------------------------------------------
  // ReportMedia — a couple of sample attachments
  // ------------------------------------------------------------------
  await prisma.reportMedia.upsert({
    where: { id: "seed-media-1" },
    create: { id: "seed-media-1", reportId: reports[0].id, url: "https://example.com/photos/pothole.jpg", mimeType: "image/jpeg", sizeBytes: 204800 },
    update: {},
  });

  await prisma.reportMedia.upsert({
    where: { id: "seed-media-2" },
    create: { id: "seed-media-2", reportId: reports[1].id, url: "https://example.com/photos/streetlight.jpg", mimeType: "image/jpeg", sizeBytes: 153600 },
    update: {},
  });

  // ------------------------------------------------------------------
  // Moderation records
  // ------------------------------------------------------------------
  const moderationSeeds = [
    { id: "seed-mod-1", reportId: reports[4].id, moderatorId: admin.id, outcome: "approved", reason: "Issue confirmed and resolved." },
    { id: "seed-mod-2", reportId: reports[5].id, moderatorId: admin.id, outcome: "rejected", reason: "Duplicate of existing report." },
    { id: "seed-mod-3", reportId: reports[1].id, moderatorId: admin.id, outcome: "flagged",  reason: "Needs additional evidence."   },
  ];

  await Promise.all(
    moderationSeeds.map((m) =>
      prisma.moderation.upsert({ where: { id: m.id }, create: m, update: {} })
    )
  );

  // ------------------------------------------------------------------
  // AuditEvents — lightweight audit timeline
  // ------------------------------------------------------------------
  const ipHash = createHash("sha256").update("127.0.0.1").digest("hex");

  await prisma.auditEvent.upsert({
    where: { id: "seed-audit-1" },
    create: {
      id: "seed-audit-1",
      actorUserId: admin.id,
      eventType: "moderation.approved",
      payload: JSON.stringify({ reportId: reports[4].id, outcome: "approved" }),
      actorIpHash: ipHash,
    },
    update: {},
  });

  console.log("✅ Seed complete");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
