# Persistence Indexing Strategy

This document captures the indexing decisions for the `Report` and `Moderation`
models in `apps/api/prisma/schema.prisma`, with rationale for each index and
guidance for future additions.

## 1. Goals

- Optimize the report lookup and timeline queries exercised by
  `apps/api/src/modules/reports/`.
- Keep write overhead predictable as new models land.
- Stay explicit about which indexes are correctness-critical (uniqueness,
  foreign keys) versus read-acceleration.

## 2. Scope

In scope:

- Prisma `@@index` / `@@unique` declarations on the persistence layer.
- Migration notes for adding new indexes safely.

Out of scope:

- Application-level caching.
- Full-text search (separate workstream).
- Mobile / web client caches.

---

## 3. Current Schema

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  displayName  String?
  avatarUrl    String?
  bio          String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  reports    Report[]
  moderation Moderation[]
}

model Report {
  id          String   @id @default(cuid())
  authorId    String
  title       String
  description String
  status      String   @default("draft")
  visibility  String   @default("private")
  location    String?
  mediaUrls   String   @default("[]")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  author     User         @relation(fields: [authorId], references: [id])
  moderation Moderation[]

  @@index([authorId])
  @@index([status])
  @@index([createdAt])
}

model Moderation {
  id          String   @id @default(cuid())
  reportId    String
  moderatorId String
  outcome     String
  reason      String?
  createdAt   DateTime @default(now())

  report    Report @relation(fields: [reportId], references: [id])
  moderator User   @relation(fields: [moderatorId], references: [id])

  @@index([reportId])
  @@index([moderatorId])
}
```

---

## 4. Index Rationale

### 4.1 `User`

| Column | Index | Source |
| ------ | ----- | ------ |
| `email` | implicit `@unique` | Login lookups in `auth.service.ts` always filter by email. The unique constraint doubles as the read index — no additional `@@index` needed. |

### 4.2 `Report`

The list endpoint in `report.controller.ts` reads two optional query params —
`status` and `authorId` — and the timeline view orders by `createdAt desc`.
Three single-column indexes cover all observed query patterns:

| Column | Index kind | Rationale |
| ------ | ---------- | --------- |
| `authorId` | `@@index` | Powers the `authorId` filter. Also backs the Prisma relation FK from `Report` to `User`. |
| `status` | `@@index` | Powers the `status` filter. Avoids a full table scan when listing reports by state (e.g. `draft`, `resolved`). |
| `createdAt` | `@@index` | Powers `ORDER BY createdAt DESC` for the timeline view. |

**Why not a composite index?**
The `status` and `authorId` filters on the list endpoint are both optional —
a request can carry either, both, or neither. A composite index on
`(authorId, status, createdAt)` can only be used left-to-right; queries that
omit `authorId` cannot use it. Three separate single-column indexes let the
query planner choose the best index for each filter combination and are the
correct choice for optional, independent predicates.

If a future query pattern _always_ filters by `(authorId, status)` before
ordering by `createdAt`, add a targeted composite index at that time and
document the specific query it serves.

### 4.3 `Moderation`

| Column | Index kind | Rationale |
| ------ | ---------- | --------- |
| `reportId` | `@@index` | Foreign-key index from `Moderation` back to `Report`. Prevents a full `Moderation` scan when loading the audit timeline for a single report. |
| `moderatorId` | `@@index` | Powers moderator-scoped queries (e.g. "all moderation actions by user X"). Also backs the Prisma relation FK to `User`. |

A `createdAt` index on `Moderation` is not yet present. Add one if a timeline
or paginated audit view orders moderation records by time.

---

## 5. Adding New Indexes

1. Add the `@@index([...])` declaration to the relevant model in
   `apps/api/prisma/schema.prisma`.
2. Push the change locally:
   ```bash
   pnpm --filter @sidewalk/api exec prisma db push
   ```
3. In production (Postgres), prefer `CREATE INDEX CONCURRENTLY` to avoid
   locking the table during the index build. Prisma does not emit
   `CONCURRENTLY` by default — manage that migration manually or via a raw
   SQL migration file.
4. Never add an index that duplicates an existing one. Prisma will error on
   duplicate declarations, which is the intended safety net.

---

## 6. Validation

Before merging any schema change that adds an index:

```bash
pnpm --filter @sidewalk/api typecheck   # schema must still compile
pnpm --filter @sidewalk/api test        # existing tests must pass unchanged
```

For significant queries, capture an `EXPLAIN ANALYZE` on a
representative dataset and include the output in the PR description.

---

## 7. Open Questions

- **Pagination strategy:** The list endpoint currently returns all matching
  records. When cursor-based pagination is added, the `createdAt` index will
  serve as the cursor anchor. Offset-based pagination does not change the
  index shape but is less efficient on large tables.
- **Soft delete:** If a `deletedAt` column is added to `Report`, consider a
  partial index (`WHERE deletedAt IS NULL`) to exclude deleted rows from list
  scans. Prisma's support for partial-index predicates on `@@index` is still
  evolving; revisit when the column lands.
- **Region scoping:** If reports become region-scoped, a leading `regionId`
  column in the composite index may be warranted. Defer until the feature is
  specced.
