# Service-to-Service Trust Handshake: API → Stellar Service

## Mechanism

The API authenticates requests to the Stellar service using a **shared secret header**.

Every request from the API to `stellar-service` must include:

```
X-Internal-Secret: <STELLAR_INTERNAL_SECRET>
```

The Stellar service rejects any request missing or presenting an incorrect secret with `401 Unauthorized`.

## Environment variables

| Variable | Where set | Purpose |
|---|---|---|
| `STELLAR_INTERNAL_SECRET` | API + Stellar service | Shared secret for internal calls |

Both services must be started with the same value. In local development the `.env.example` files provide a placeholder. In deployment, inject via secrets manager.

## Middleware (stellar-service)

`apps/stellar-service/src/middleware/requireInternalSecret.ts` exports a single Express middleware that:

1. Reads `X-Internal-Secret` from the request header.
2. Compares it to `STELLAR_INTERNAL_SECRET` using a constant-time comparison.
3. Returns `401 { error: "Unauthorized" }` on mismatch or absence.
4. Calls `next()` on success.

Apply it to any route that acts on account-linked data. The `/health` endpoint is intentionally left open for load-balancer probes.

## Local development

Add to `apps/api/.env` and `apps/stellar-service/.env`:

```
STELLAR_INTERNAL_SECRET=dev-internal-secret-replace-in-prod
```

The placeholder value is safe for local use only. Never commit a real secret.

## Future hardening

- Rotate the secret via environment re-deploy without code changes.
- Replace with mTLS or a short-lived JWT signed by the API's private key once the deployment environment supports it.
- Add request signing (HMAC over body + timestamp) to prevent replay attacks before production launch.

## Integration notes

- The middleware is covered by a unit test in `apps/stellar-service/src/middleware/requireInternalSecret.test.ts`.
- The API should set `STELLAR_INTERNAL_SECRET` in its environment and pass it as the header when calling any Stellar service route beyond `/health`.
