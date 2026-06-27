# Report Draft and Submission Schema

This document is a scaffold for
[#550 — Model the first relational schema additions for report drafts and submissions](https://github.com/MixMatch-Inc/Sidewalk/issues/550).

It captures the shape of the schema additions needed so the final
implementation PR can fill in concrete field types without
restructuring the relationships or renaming models.

## 1. Goals

- Introduce `ReportDraft` and `ReportSubmission` as the first
  relational models beyond `User` in
  `apps/api/prisma/schema.prisma`.
- Match the on-the-wire shapes already exported from
  `packages/shared/src/types/civic.ts` (`Report`, `ReportDraft`,
  `ReportSubmission`, `ReportSummary`).
- Stay compatible with #548 (seed fixtures) and
  #551 (audit / moderation fields) without locking either of them
  in.

`TODO`: confirm whether `ReportDraft` and `ReportSubmission` should
be one model (`Report` with a `status` enum) or two. The shared
types package exports `ReportDraft` as a *separate* interface,
which is suggestive but not conclusive — verify with the model
owners before opening the implementation PR.

## 2. Model Inventory

### 2.1 `ReportDraft`

Corresponds to the `ReportDraft` interface in
`packages/shared/src/types/civic.ts`.

| Field         | Type       | Note                                                  |
| ------------- | ---------- | ----------------------------------------------------- |
| `id`          | identifier | `cuid()` (matches `User.id` convention).              |
| `authorId`    | FK → `User` | Required. Delete behavior `TODO`.                    |
| `title`       | string     | Length limit `TODO`.                                  |
| `description` | string     | Optional vs required — `TODO`.                        |
| `visibility`  | enum       | `Visibility` enum, re-exported via `civic.ts` (defined in `packages/shared/src/types/enums.ts`). |
| `location`    | string     | Optional.                                             |
| `mediaUrls`   | string[]   | Optional; default `[]` `TODO`.                        |
| `status`      | enum       | Constrained to `Extract<ReportStatus, "draft">` per the shared type. |
| `createdAt`   | datetime   | `default(now())`.                                     |
| `updatedAt`   | datetime   | `@updatedAt`.                                         |

`TODO`: define the 1:N relationship to `ReportSubmission` once #550
finalizes whether one draft yields one or many submissions.

### 2.2 `ReportSubmission`

Corresponds to the `ReportSubmission` interface and the runtime
`Report` shape consumed by the controller at
`apps/api/src/modules/reports/controllers/report.controller.ts`.

| Field         | Type       | Note                                                  |
| ------------- | ---------- | ----------------------------------------------------- |
| `id`          | identifier | `cuid()`.                                              |
| `authorId`    | FK → `User` | Required.                                              |
| `title`       | string     | Inherits from draft, mutable. `TODO` re-validation.   |
| `description` | string     | Same as draft.                                         |
| `visibility`  | enum       | Same as draft (see `ReportDraft.visibility` above).   |
| `location`    | string     | Optional.                                              |
| `mediaUrls`   | string[]   | Optional.                                              |
| `status`      | enum       | Computed from moderation events (see #551).           |
| `createdAt`   | datetime   | `default(now())`.                                      |
| `updatedAt`   | datetime   | `@updatedAt`.                                          |

`TODO`: add an `@@index` set per the indexing strategy note for
[#549](https://github.com/MixMatch-Inc/Sidewalk/issues/549) once the
composite-vs-single-column decision is finalized there.

## 3. Relationships

```
User 1 ── n ReportDraft 1 ── n ReportSubmission 1 ── n ModerationEvent
```

`TODO`: validate the cardinality after the assignment clarifies
whether "submission" is a state transition (one report, one
submission event) or a separate persisted entity.

## 4. Compatibility Boundaries

- `apps/api/src/modules/reports/controllers/report.controller.ts`
  reads `status` and `authorId` filters from `req.query`. The
  `ReportSubmission` model must support both filter paths.
- `packages/shared/src/types/civic.ts` defines the on-the-wire
  shape; schema additions must produce records that round-trip
  through the shared types without coercion.

## 5. Migration Plan

- Run `prisma migrate dev --name add_report_models` after the
  schema is final.
- Land *after* #548, so the seed fixtures can exercise the new
  models.
- Coordinate with #551 if the moderation events hook into the
  same audit table; otherwise #551 can ship independently.

## 6. Validation

- `pnpm --filter @sidewalk/api typecheck` passes.
- `pnpm --filter @sidewalk/api test` passes without modification
  (existing report module tests should still succeed).
- `pnpm --filter @sidewalk/api exec prisma format` produces no
  warnings.
- `pnpm --filter @sidewalk/api exec prisma validate` exits 0.

## 7. Open Questions

- One model (`Report` with `status` enum) vs two models — see §1.
- Soft-delete / archive strategy (linked to "Open Questions" in
  [#549](https://github.com/MixMatch-Inc/Sidewalk/issues/549)).
- Whether `ReportDraft` is exposed publicly via the API, or only
  via an internal endpoint family.
- Whether `mediaUrls` should live in a sibling table to allow per-
  media moderation metadata.
