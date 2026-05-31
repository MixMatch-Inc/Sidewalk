# Auth Funnel Instrumentation Plan

Closes #438

## Purpose

Authentication is only valuable if it leads users into the product. This document defines the instrumentation plan for the login-to-first-report funnel so that future reporting issues can reference it directly.

## Funnel steps

| Step | Event name | Owner |
|---|---|---|
| Successful login | `LOGIN_SUCCESS` | API |
| Email verified (first time) | `EMAIL_VERIFIED` | API |
| Profile viewed for first time | `PROFILE_FIRST_VIEW` | Web / Mobile client |
| Report creation started | `REPORT_DRAFT_STARTED` | Web / Mobile client |
| Report submitted | `REPORT_SUBMITTED` | API |

The funnel begins at `LOGIN_SUCCESS` and ends at `REPORT_SUBMITTED`. Drop-off between any two consecutive steps is the primary metric.

## Client vs API responsibilities

**API emits:**
- `LOGIN_SUCCESS` — already in `AUTH_AUDIT_RETENTION.md`
- `EMAIL_VERIFIED` — already in `AUTH_AUDIT_RETENTION.md`
- `REPORT_SUBMITTED` — to be added when reporting routes land

**Clients (web and mobile) emit:**
- `PROFILE_FIRST_VIEW` — fire once per account on first profile screen render; guard with a local flag so it does not re-fire on refresh
- `REPORT_DRAFT_STARTED` — fire when the user opens the new-report form for the first time in a session

Client events are sent to the API via a lightweight analytics endpoint (to be defined in the reporting milestone). For the MVP, clients may log these to the console and structured stdout until the endpoint exists.

## Auth-success moments that feed into future product events

1. **Login success → profile prompt** — a newly verified account should be nudged toward completing a profile before reporting. The `EMAIL_VERIFIED` event is the trigger.
2. **Login success → pending report** — if a user was redirected to login mid-flow, restore the intended destination after `LOGIN_SUCCESS` (see `AUTH_ANONYMOUS_HANDOFF.md`).
3. **Session refresh → silent continuation** — a successful token refresh should not interrupt an in-progress report draft. The client should retry the failed request transparently.

## MVP constraints

- No third-party analytics SDK in the starter. All events go to structured stdout or a future internal endpoint.
- Event payloads must never include passwords, raw tokens, or email addresses (consistent with `AUTH_AUDIT_RETENTION.md`).
- Funnel metrics are read from log aggregator queries in the MVP, not a dedicated analytics database.

## Extending this plan

When reporting flows land:
1. Add `REPORT_SUBMITTED` to the API audit event table in `AUTH_AUDIT_RETENTION.md`.
2. Implement the analytics endpoint and wire up client events.
3. Reference this document in the reporting milestone spec.
