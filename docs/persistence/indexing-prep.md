# Indexing Strategy Notes — Preparation

This document is a scaffold for
[#559 — Prepare indexing strategy notes for report lookup and timeline queries](https://github.com/MixMatch-Inc/Sidewalk/issues/559).

A preparation-pass note that distills the design questions
before concrete `@@index` declarations are written. Cross-links:
[#549 indexing-strategy (kilodesodiq-arch draft)](https://github.com/MixMatch-Inc/Sidewalk/issues/549),
[#551 migration-safety](https://github.com/MixMatch-Inc/Sidewalk/issues/551),
[#555 first relational schema](https://github.com/MixMatch-Inc/Sidewalk/issues/555).

## 1. Goals

- Identify the read paths in
  `apps/api/src/modules/reports/` that motivate each `@@index`
  declaration.
- Outline the composite-vs-single-column tradeoff so the
  implementation PR can pick confidently.
- Cross-link the audit-table indexing decisions handled in #551.

## 2. Read-Path Inventory

Per `apps/api/src/modules/reports/controllers/report.controller.ts`:

- List endpoint reads `status` and `authorId` filters from
  `req.query`.
- Timeline view orders by `createdAt desc`.
- Pagination shape still `TODO`.

`TODO`: confirm pagination strategy (cursor vs offset) with
the report module owners before declaring any index with
`createdAt` in the leading position.

## 3. Composite vs Single-Column

If the list query always carries both `authorId` and `status`,
the composite `(authorId, status, createdAt)` removes a sort
step. If either filter can be omitted, two single-column
indexes plus a sort step is the safer choice. Same caveat as
[#549 §4.1](https://github.com/MixMatch-Inc/Sidewalk/issues/549).

## 4. Audit-Table Indexes (#551)

Once #551 names the `AuditEvent` (or equivalent) model, expect
`@@index([reportId])` and `@@index([createdAt])` at minimum.
Carry them through the same migration workflow as the report
indexes.

## 5. Validation

- `EXPLAIN QUERY PLAN` (SQLite) or `EXPLAIN ANALYZE` (Postgres)
  on the production-shaped list query, captured as a comment
  under the relevant controller before merging the
  implementation PR.
- `pnpm --filter @sidewalk/api test` still passes.

## 6. Open Questions

- Soft-delete / archived reports — do we need a partial index?
- Multi-region reports — does the composite need a leading
  `regionId`?
- Are timeline queries paginated forward only, or bidirectional?
- Should the `AuditEvent` indexes be partial (excluded from
  soft-deleted markers)?
