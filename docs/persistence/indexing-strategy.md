# Persistence Indexing Strategy

This document is a scaffold for
[#549 — Add indexing strategy notes for report lookup and timeline queries](https://github.com/MixMatch-Inc/Sidewalk/issues/549).
Each section below describes the shape of a concrete decision that the
final note should make once the persistence schema in
`apps/api/prisma/schema.prisma` and the report module under
`apps/api/src/modules/reports/` have reached a steady shape. Replace
the `TODO:` entries with the real rationale, field names, and index
declarations as the supporting PRs land.

## 1. Goals

- Optimize the report lookup and timeline queries exercised by
  `apps/api/src/modules/reports/`.
- Keep write costs predictable as new models land (see
  [#550](https://github.com/MixMatch-Inc/Sidewalk/issues/550),
  [#551](https://github.com/MixMatch-Inc/Sidewalk/issues/551)).
- Stay explicit about which indexes are correctness-critical (uniqueness,
  foreign keys) versus read-acceleration.
- TODO: enumerate the specific read paths in the report module that drive
  the index choice (status filter, author filter, timeline ordering, etc.).

## 2. Scope

In scope:

- Prisma `@@index` / `@@unique` declarations on the persistence layer.
- Companion migration strategy (separate from
  [#551](https://github.com/MixMatch-Inc/Sidewalk/issues/551), which targets
  forward-compatibility of *fields*).

Out of scope:

- Application-level caching.
- Full-text search (separate workstream).
- Mobile / web client caches.

TODO: confirm with the report module owners whether `pagination` plus
`status` plus `authorId` plus an eventual `createdAt` window is the full set
of filters we expect at v1.

## 3. Current State

### 3.1 Schema (`apps/api/prisma/schema.prisma`)

Today the schema models only `User`:

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

- `User.email` already has an implicit unique index — supports login lookups
  in `apps/api/src/modules/auth/services/auth.service.ts` without an extra
  scan.

### 3.2 Query patterns observed

From `apps/api/src/modules/reports/controllers/report.controller.ts`, the
report list endpoint currently reads two filters from `req.query`:

- `status` (`string | undefined`)
- `authorId` (`string | undefined`)

TODO: enumerate the remaining filters and ordering requirements once the
`Report` model lands (see
[#550](https://github.com/MixMatch-Inc/Sidewalk/issues/550)). For the v1
list endpoint the minimum query surface is:

- Filter by `status` and `authorId`.
- Order by `createdAt desc` for the timeline view.
- Paginate via `cursor` or `offset` (decision pending).

### 3.3 What we don't yet have

- A `Report` model in the Prisma schema (referenced indirectly by the
  controller).
- A `ReportStatus` enum (referenced in `packages/shared/src/types/civic.ts`).
- Audit and moderation tables (target of
  [#551](https://github.com/MixMatch-Inc/Sidewalk/issues/551)).

## 4. Index Plan (v1)

The plan below is **provisional** — it assumes the simplest viable Report
shape. Final choices belong in `apps/api/prisma/schema.prisma` once
[#550](https://github.com/MixMatch-Inc/Sidewalk/issues/550) lands.

### 4.1 Report

| Column(s)        | Index kind     | Rationale                                  |
| ---------------- | -------------- | ------------------------------------------ |
| `(authorId)`     | `@@index`      | Powers `authorId` filter on list endpoint. |
| `(status)`       | `@@index`      | Powers `status` filter on list endpoint.   |
| `(createdAt)`    | `@@index`      | Powers timeline ordering by recency.       |
| `(authorId, status, createdAt)` | composite `@@index` (candidate) | Removes the sort step on the list endpoint *only if* the WHERE clause always filters by both columns. |

**Decision pending — composite vs. single-column.** Confirm with the
report module whether listing is *always* filtered by both `authorId`
and `status` before being ordered by `createdAt`.

- If yes (every list query carries both filters), the composite form
  removes the sort step and is the better choice.
- If either filter can be omitted on a given request, Prisma (and
  SQLite / Postgres) cannot exploit the composite index left-to-right;
  prefer two single-column `@@index` declarations and let the planner
  sort.

Document the chosen form here before opening the implementation PR.

### 4.2 Moderation / audit (forward-looking)

Pending the schema additions in
[#551](https://github.com/MixMatch-Inc/Sidewalk/issues/551), the audit
table(s) introduced there will likely need indexes of their own. The
exact shape is `TODO` until #551 defines it — at minimum expect:

- A foreign-key index from the audit table back to `Report` (i.e.
  `@@index([reportId])` once the relationship is named in the schema).
- A secondary index on the audit timestamp column for moderation /
  timeline views (e.g. `@@index([createdAt])`).

Replace the placeholder names (`reportId`, `createdAt`) with the actual
field names chosen in #551, then mirror those declarations here and in
`schema.prisma`.

## 5. Migration Safety

- Adding an index is non-breaking at the API layer but can be expensive on a
  large table. Prefer `CREATE INDEX CONCURRENTLY` semantics if we migrate
  off SQLite (see env note in
  [environment.md](../environment.md) about managed Postgres in production).
- Never add an index that duplicates an existing one — Prisma will error
  out, which is the desired safety net.
- TODO: document how this scaffold's index plan interacts with the
  migration-safe-fields work in
  [#551](https://github.com/MixMatch-Inc/Sidewalk/issues/551) once both
  PRs land.

## 6. Validation

Before opening the real (non-scaffold) PR, the index additions should be
verified by:

- `pnpm --filter @sidewalk/api typecheck` — schema must still type-check.
- `pnpm --filter @sidewalk/api test` — existing report module tests should
  pass without modification.
- An `EXPLAIN` / `EXPLAIN ANALYZE` on the production-shaped query for the
  v1 list endpoint, captured in a comment under the relevant controller.

TODO: link to the first test that exercises the indexed query once it
exists.

## 7. Open Questions

- Pagination strategy: cursor-based vs. offset-based — affects how
  `createdAt` is indexed.
- Soft-delete: do we mark `Report.deletedAt` and rely on a partial
  index (`@@index([...])` with a `WHERE deletedAt IS NULL` clause),
  or hard-delete? Native partial-index support in Prisma is still an
  evolving area and the exact predicate syntax differs between
  `@@unique` and `@@index`; defer this decision until a soft-delete
  column is actually added.
- Multi-region: if reports can be region-scoped, do we need a leading
  `regionId` in the composite index?

