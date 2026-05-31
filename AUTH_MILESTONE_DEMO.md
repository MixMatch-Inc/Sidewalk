# Authentication Milestone Demo Script

Closes #441

## Purpose

This script walks through the current auth foundation across the rebuilt Sidewalk monorepo. Use it for maintainer reviews, contributor onboarding, and hackathon showcases.

## Setup assumptions

- Node.js 20+ and pnpm 10+ are installed.
- The repo is cloned and dependencies are installed (`pnpm install`).
- `apps/api/.env` exists with at minimum:
  ```
  APP_ENV=development
  JWT_SECRET=<any-local-secret>
  ENABLE_DEV_AUTH_SHORTCUTS=true
  ```
  Copy from `apps/api/.env.example` and fill in `JWT_SECRET`.
- No external database is required. The API uses in-memory stores for the MVP.

## Step 1 — Start the API

```bash
pnpm dev:api
```

Expected: Express server starts on `http://localhost:3001` (or the port in your `.env`). You should see a startup log line.

## Step 2 — Register an account

```bash
curl -s -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"password123"}' | jq .
```

Expected response (`201`):
```json
{
  "id": "<uuid>",
  "email": "demo@example.com",
  "verified": false,
  "createdAt": "<timestamp>"
}
```

## Step 3 — Log in

```bash
curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"password123"}' | jq .
```

Expected response (`200`):
```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<token>",
  "account": { "id": "...", "email": "demo@example.com", "verified": false }
}
```

Save the `accessToken` and `refreshToken` for the next steps.

## Step 4 — Access a protected route

```bash
curl -s http://localhost:3001/auth/logout \
  -X POST \
  -H "Authorization: Bearer <accessToken>" | jq .
```

Expected: `200 { "message": "..." }`. Using an invalid or missing token returns `401`.

## Step 5 — Refresh the session

```bash
curl -s -X POST http://localhost:3001/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}' | jq .
```

Expected: new `accessToken` and `refreshToken` pair. The old refresh token is now invalid (rotation).

## Step 6 — Brute-force lockout (optional)

Send five consecutive bad-password login attempts:

```bash
for i in {1..5}; do
  curl -s -X POST http://localhost:3001/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"demo@example.com","password":"wrong"}' | jq .status
done
```

Expected: first attempts return `401 INVALID_CREDENTIALS`, final attempt returns `403 ACCOUNT_LOCKED`.

## Step 7 — Start the web app (optional)

```bash
pnpm dev:web
```

Open `http://localhost:3000`. The login and register pages are available. Middleware redirects unauthenticated requests to `/login` with a `redirect` param preserved (see `apps/web/AUTH_ANONYMOUS_HANDOFF.md`).

## Success criteria

- [ ] API starts without errors.
- [ ] Register returns `201` with account shape.
- [ ] Login returns `200` with token pair.
- [ ] Protected route rejects missing/invalid token with `401`.
- [ ] Token refresh returns a new pair and invalidates the old refresh token.
- [ ] Repeated bad logins trigger `403 ACCOUNT_LOCKED`.

## Known gaps (honest)

- Email verification tokens are generated but email delivery is a no-op in the starter (see `apps/api/src/services/emailTransport.ts`). Accounts remain `verified: false` until a real transport is wired up.
- The web app has no dashboard yet; after login the user lands on a placeholder page.
- Mobile (`pnpm dev:mobile`) requires Expo Go or a simulator and is not covered in this script.
- The stellar-service workspace is not exercised by auth flows yet.
- In-memory stores reset on API restart; there is no persistent database in the MVP.

## Reusing this script

After each batch of auth-related PRs lands, re-run steps 1–6 to confirm no regressions. When reporting flows exist, extend step 4 to exercise `POST /reports` and update the success criteria accordingly.

## Related documents

- `apps/api/AUTH_API.md` — full endpoint reference
- `apps/api/AUTH_DECISIONS.md` — policy decisions
- `apps/api/AUTH_FUNNEL_INSTRUMENTATION.md` — post-login funnel plan
- `apps/web/AUTH_ANONYMOUS_HANDOFF.md` — anonymous-to-account handoff
- `apps/api/AUTH_ADMIN_BOUNDARY.md` — admin/moderation auth boundary
- `apps/web/AUTH_CONTRIBUTING.md` — web auth contributor guide
