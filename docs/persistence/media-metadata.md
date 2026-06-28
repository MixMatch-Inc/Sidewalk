# Media Metadata Additions

This document is a scaffold for
[#547 — Add media metadata so attachments can be introduced without a schema rewrite](https://github.com/MixMatch-Inc/Sidewalk/issues/547).

Captures the design boundary before any media-related field is
added to the schema. Companion notes:
[#551 migration-safety](https://github.com/MixMatch-Inc/Sidewalk/issues/551),
[#555 first relational schema](https://github.com/MixMatch-Inc/Sidewalk/issues/555).

## 1. Goals

- Permit `mediaUrls` and per-medium metadata (mime, size,
  uploaded-at, etc.) to be added incrementally without
  forcing a re-architect of the existing `Report` model.
- Keep the wire shape defined in
  `packages/shared/src/types/civic.ts` unchanged for clients
  that don't yet opt in.
- Stay migration-safe per #551 conventions.

## 2. Current State

`packages/shared/src/types/civic.ts` exposes
`Report.mediaUrls: string[]`. The current Prisma models in
`apps/api/prisma/schema.prisma` mirror that, but do *not* hold
per-medium metadata.

## 3. Schema Additive Options

Three additive patterns, all migration-safe:

1. **Sibling table.** New `ReportMedia` with FK to `Report`,
   `@@index([reportId])`. Most flexible; moderation metadata
   can live alongside each medium.
2. **JSON column.** Add `mediaMetadata Json?` on `Report`,
   with a documented shape contract.
3. **Sibling array columns.** `mediaMimeTypes string[]`,
   `mediaSizes int[]`, etc., parallel to `mediaUrls`.

`TODO`: confirm option (1) as the chosen form. The table
reads cleanly and doesn't grow the `Report` row when media
lists are long. The JSON path is appealing for early
iteration but eventually burdens schema review.

## 4. Migration Plan

For option (1):

1. Add `model ReportMedia` to `apps/api/prisma/schema.prisma`.
2. `prisma migrate dev --name add_report_media`.
3. Update `packages/shared/src/types/civic.ts` with the new
   `ReportMedia` interface.
4. Update `apps/api/src/modules/reports/services/report.service.ts`
   to read / write through the new table.

`TODO`: decide whether to bundle the migration with #555
(`Report` shape work) or land separately.

## 5. Validation

- `pnpm --filter @sidewalk/api typecheck` passes.
- `pnpm --filter @sidewalk/api test` passes.
- New test under `apps/api/src/modules/reports/tests/`
  exercises a draft with two media items and confirms the
  read round-trips.

## 6. Open Questions

- Per-medium moderation metadata (visibility, removed-at,
  reason) — does it live on `ReportMedia` or in the future
  audit table from #551?
- CDN URLs vs raw storage URLs — does the metadata table
  store both?
- Should `mediaUrls` be deprecated once the table exists,
  or kept as a denormalized snapshot for read-cost reasons?
