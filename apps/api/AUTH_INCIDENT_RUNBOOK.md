# Auth Incident Runbook

Quick reference for auth failures during demos, community sprints, or local development.

---

## 1. Login is broken — users cannot sign in

**Symptoms:** `401 INVALID_CREDENTIALS` for known-good accounts, or login endpoint returns 5xx.

**Steps:**
1. Check API logs for the error message and stack trace.
2. Confirm the API process is running (`pnpm dev:api` or check the process list).
3. Verify `JWT_SECRET` (or `JWT_PRIVATE_KEY`) is set and non-empty in `apps/api/.env`.
4. If using a database, confirm the connection is healthy and the `accounts` table is reachable.
5. Restart the API process and retry.

---

## 2. Verification emails are not arriving

**Symptoms:** Users register but never receive the email verification link.

**Steps:**
1. Check API logs for mail-send errors (look for `MAIL_` prefixed log lines).
2. Confirm `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, and `MAIL_PASS` are set in `apps/api/.env`.
3. For local dev, confirm the mail sandbox (e.g., Mailpit) is running and the port matches.
4. Check the spam/junk folder on the receiving address.
5. Use `POST /auth/dev/seed-user` (dev only) to create a pre-verified account and bypass email for demo purposes.

---

## 3. Sessions are invalid or expire unexpectedly

**Symptoms:** Access tokens rejected immediately, or refresh tokens fail with `401 INVALID_TOKEN`.

**Steps:**
1. Confirm `JWT_SECRET` has not changed since the tokens were issued. A secret rotation invalidates all existing tokens — this is expected.
2. Check `ACCESS_TOKEN_EXPIRES_IN` and `REFRESH_TOKEN_EXPIRES_IN` in `.env`. Defaults are `15m` / `30d`.
3. Confirm the client is sending the `Authorization: Bearer <token>` header correctly.
4. If the web app is affected, check `apps/web/lib/authClient.ts` — `refreshSession` should be called before retrying.
5. For mobile, check `apps/mobile/src/lib/secureStorage.ts` to confirm tokens are being persisted correctly.

---

## 4. Test secret or JWT secret is compromised

**Symptoms:** A secret value was committed to git, shared in a public channel, or otherwise exposed.

**Steps:**
1. **Immediately** rotate the secret: generate a new value and update `apps/api/.env` (and `apps/stellar-service/.env` if `STELLAR_INTERNAL_SECRET` is affected).
2. Restart all affected services so the new secret takes effect.
3. All existing sessions signed with the old secret are now invalid — this is the correct outcome.
4. If the secret was committed to git, remove it from history using `git filter-repo` or contact the repo admin.
5. Audit recent API logs for unexpected calls that may have used the exposed secret.

---

## 5. Account lockout during a demo

**Symptoms:** A demo account hits the failed-login lockout and returns `403 ACCOUNT_LOCKED`.

**Steps:**
1. Wait for the lockout to expire automatically (time-boxed, see `AUTH_DECISIONS.md`).
2. Or, in development, restart the API to clear in-memory lockout state.
3. Use `POST /auth/dev/seed-user` to create a fresh demo account if the lockout cannot wait.

---

## Boundaries quick reference

| Layer | Where to look |
|---|---|
| API routes and errors | `apps/api/src/` + logs |
| Web session handling | `apps/web/lib/authClient.ts` |
| Mobile token storage | `apps/mobile/src/lib/secureStorage.ts` |
| Stellar internal auth | `apps/stellar-service/STELLAR_SERVICE_AUTH.md` |
| Auth policy decisions | `apps/api/AUTH_DECISIONS.md` |
| Audit retention | `apps/api/AUTH_AUDIT_RETENTION.md` |

---

Keep this runbook updated as new auth surfaces are added. If a scenario recurs, add it here.
