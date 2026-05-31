# Anonymous-to-Account Handoff

Closes #439

## Purpose

Users may encounter the product before they have an account. This document defines how an anonymous visitor transitions into a signed-in account without losing context.

## Primary handoff path: report-intent redirect

A visitor who attempts to file a report without being signed in is the most meaningful pre-auth action in this product.

**Flow:**

1. Visitor lands on a report creation page (e.g. `/report/new`).
2. Middleware detects no valid session and redirects to `/login`.
3. The intended destination is preserved as a `redirect` query parameter: `/login?redirect=%2Freport%2Fnew`.
4. After successful login or registration, the client reads `redirect` and navigates there.
5. If `redirect` is absent or invalid, fall back to the dashboard root.

**Web implementation:**

- `apps/web/middleware.ts` already intercepts unauthenticated requests. Add `redirect` param preservation there.
- After `LOGIN_SUCCESS`, `apps/web/lib/authClient.ts` should read `searchParams.get('redirect')` and call `router.replace(redirect)`.
- Validate the redirect value: only allow same-origin relative paths. Reject absolute URLs and `//` prefixes to prevent open-redirect attacks.

**Mobile implementation:**

- Store the intended deep link in component state or a lightweight context before pushing to the auth screen.
- After login, pop back to the stored route using the navigation stack.
- The `sidewalk://` deep link scheme (see `apps/mobile/DEEP_LINKS.md`) can carry a `next` parameter for external entry points.

## Context that survives the transition

| Context | Preserved how |
|---|---|
| Intended destination URL | `redirect` query param (web) / navigation state (mobile) |
| Report draft (future) | Local storage keyed to a session-less draft ID; merge into account on first login |
| UTM / referral params | Pass through `redirect` URL or store in sessionStorage before redirect |

Draft merging is deferred until the reporting milestone. The pattern is named here so it is not designed blindly later.

## What is not preserved in MVP

- Form field values typed before the redirect (too complex for the starter; acceptable UX tradeoff).
- Anonymous browsing history beyond the single intended destination.

## Decision: one shared auth flow

Anonymous users enter the same `/login` and `/register` screens as returning users. There is no separate "guest checkout" style flow in the MVP. This keeps the auth surface small and avoids a parallel session model.

## Room for richer pre-auth experiences

This decision does not prevent later additions such as:
- A read-only preview mode that defers the auth prompt.
- A "save progress" prompt that triggers signup mid-draft.
- Social/OAuth entry points that skip the password form entirely.

Those can be layered on top of the `redirect` handoff pattern without changing the core flow.
