# Migration-Safe Field Conventions for Future Audit, Moderation, and Assignment

This document is a scaffold for
[#551 — Model migration-safe fields for future assignment, moderation, and audit records](https://github.com/MixMatch-Inc/Sidewalk/issues/551).

It captures the conventions for adding fields to the persistence
schema in a way that does **not** break existing deployments, does
not require a coordinated client release, and keeps the audit
surface forward-compatible.

## 1. Goals

- Establish a set of conventions so future field additions (for
  example `assignedModeratorId`, `auditActorId`, `auditIpHash`)
  can be added without a backwards-incompatible migration.
- Keep the conventions aligned with
  [environment.md](../environment.md), which assumes a SQLite-in-dev
  and Postgres-in-production swap.
- Hand off cleanly to the eventual audit-table schema work
  tracked independently of #550.

`TODO`: enumerate the specific fields the team has on its roadmap so
they are covered by the conventions rather than listed as separate
one-off decisions.

## 2. Additive Field Conventions

A field is **migration-safe** if it satisfies **all** of the
following:

1. **Nullable at the DB layer.** Either `String?` / `Int?` in
   Prisma, or a column-level default of `NULL`. Existing rows are
   valid as-is without a backfill.
2. **No application-level invariant** depends on the field being
   non-null. Validators under
   `apps/api/src/modules/<module>/validators/` treat absent values
   as legitimate.
3. **No index depends on** the field being populated. Indexes
   that include the new column must be partial / conditional,
   otherwise existing rows force a `NULL` sort key.
4. **Forward- and back-readable.** Older clients that don't know
   about the field ignore it; newer clients treat absent fields as
   missing-but-acceptable.

`TODO`: codify these as a checklist in
[contributing.md](../contributing.md) once the conventions
stabilize, so future PRs can self-audit.

## 3. Field Categories

### 3.1 Assignment

Fields that link a `Report` (or its #550-defined successor
models) to a `User` with moderator privileges.

- Candidate field: `assignedModeratorId` (`String?`, FK to
  `User.id`).
- Index: only if the indexing strategy in
  [#549](https://github.com/MixMatch-Inc/Sidewalk/issues/549)
  finds the composite `(assignedModeratorId, status, createdAt)`
  useful; otherwise defer.

### 3.2 Moderation outcomes

Fields that record the result of a moderation decision.

- Most naturally land as rows of a future `ModerationEvent` table
  rather than as columns on `Report`. This minimizes schema churn
  and lets the audit timeline grow without DDL changes.

### 3.3 Audit metadata

Fields or tables capturing *who did what when*.

- Source-of-truth: an `AuditEvent` table (or equivalent), with
  required `actorUserId`, optional `actorIpHash`, optional /
  truncated `actorUserAgent`, and a JSON `payload` field with a
  documented shape.
- Decision pending: whether the audit table emits events
  synchronously or via the same outbox pattern other parts of the
  app use. `TODO`.

`TODO`: write a small example `AuditEvent` payload shape (one
discriminated union covering auth, report, and moderation events)
and link to it from this section.

## 4. Anti-patterns to Reject

- **Adding a non-nullable column without a default.** Forces a
  blocking DDL on production.
- **Renaming an existing column.** Requires a coordinated
  client-side mapping window.
- **Indexing a low-cardinality optional field unconditionally.**
  Pollutes the planner with indexes that never get used.
- **Adding a `Json` column without a documented shape contract.**
  The schema becomes unreviewable; consumers start ad-hoc parsing.
- **Combining a feature change and an audit-fields change into one
  PR.** Hard to bisect, hard to roll back.

`TODO`: cross-check these against any existing migrations in
`apps/api/prisma/migrations/` to confirm none violated them in the
past; surface any offenders for follow-up.

## 5. Migration Workflow

For each new migration-safe field:

1. Update `apps/api/prisma/schema.prisma`.
2. Run `pnpm --filter @sidewalk/api exec prisma migrate dev --name
   <feature>` locally.
3. Land the migration file in the same PR that introduces the
   field. Do not split feature and audit-field PRs.
4. Verify `pnpm --filter @sidewalk/api test` still passes —
   regression coverage on the existing report/auth tests is the
   canary.

## 6. Validation

- `pnpm --filter @sidewalk/api typecheck` passes.
- `pnpm --filter @sidewalk/api test` passes.
- The migration file is small enough to read in one screen
  (manual review gate).
- No `ALTER TABLE` statements without a corresponding read-side
  compatibility note in the PR description.

## 7. Open Questions

- Do we want a `ModerationEvent` model now (depending on #550's chosen
  shape) or defer it to a later issue?
- Does the audit table need both row-level and aggregate-level
  views, or only one?
- Soft-delete (linked to "Open Questions" in
  [#549](https://github.com/MixMatch-Inc/Sidewalk/issues/549)) is
  the single largest forward-compat decision; confirm before
  #551 ships.
- Outbox vs. synchronous emission for `AuditEvent` rows.
