# First Relational Schema — Preparation

This document is a scaffold for
[#555 — Prepare the first relational schema additions for report drafts and submissions](https://github.com/MixMatch-Inc/Sidewalk/issues/555).

A preparation-pass note covering the model-shape decisions
before they land in `apps/api/prisma/schema.prisma`.
Cross-links:
[#549 indexing-strategy](https://github.com/MixMatch-Inc/Sidewalk/issues/549),
[#550 first relational schema (kilodesodiq-arch draft)](https://github.com/MixMatch-Inc/Sidewalk/issues/550),
[#551 migration-safety](https://github.com/MixMatch-Inc/Sidewalk/issues/551).

## 1. Goals

- Decide one-vs-two model shape (`Report` with `status` enum
  vs separate `ReportDraft` + `ReportSubmission`).
- Capture cardinality between draft and submission.
- Reconcile with shared type shapes in
  `packages/shared/src/types/civic.ts`.

## 2. One-vs-Two Model Tradeoff

`ReportDraft` and `ReportSubmission` are exported as separate
interfaces in `packages/shared/src/types/civic.ts`. That
nudges toward *two models*, but it is not conclusive — the
team should confirm before opening the implementation PR.

`TODO`: decide which form ships.

## 3. Cardinality

- 1 draft → 1 submission (simple): smaller schema footprint;
  the `ReportDraft` → `ReportSubmission` transition is a
  single row.
- 1 draft → N submissions (richer): useful for
  edit-then-resubmit flows, but adds a join.

`TODO`: align with the web / mobile clients' submission
flow before committing to one form.

## 4. Migration Plan

1. Add chosen model(s) to `apps/api/prisma/schema.prisma`.
2. `prisma migrate dev --name add_report_models`.
3. Update validators under
   `apps/api/src/modules/reports/validators/` if the wire
   shape changes.
4. Add `@@index` declarations per #559 indexing-prep.

## 5. Validation

- `pnpm --filter @sidewalk/api typecheck` passes.
- `pnpm --filter @sidewalk/api test` passes.
- `prisma format` and `prisma validate` both clean.

## 6. Open Questions

- Soft-delete / archive on draft, on submission, or both?
- Do drafts need versioning (audit history) beyond the most
  recent version?
- FK cascade behavior on `authorId` when the user is deleted.
- Whether `mediaMetadata` (see #547) lives on `Report` or on
  a sibling `ReportMedia` table — affects the cardinality story.
