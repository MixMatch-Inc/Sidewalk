# API to Stellar service trust handshake

This document defines the first service-to-service trust boundary between `apps/api` and `apps/stellar-service`. The goal is a small design that works locally, can be deployed without user secrets crossing service boundaries, and leaves room for future wallet provisioning.

## Trust model

The API is the only public service allowed to translate a user session into an internal Stellar request. The Stellar service should not trust arbitrary client headers, browser cookies, or mobile tokens directly.

Instead, the API sends a short-lived internal request proof with a normalized account context. The Stellar service verifies that proof before it performs any network-facing wallet, receipt, or account-linked action.

## Request format

Every protected API-to-Stellar call should include these headers:

| Header | Source | Purpose |
| --- | --- | --- |
| `x-sidewalk-service` | API | Identifies the caller as `api`. |
| `x-sidewalk-account-id` | API | Stable internal account id for the authenticated user. |
| `x-sidewalk-request-id` | API | Unique request id for tracing and replay protection. |
| `x-sidewalk-issued-at` | API | Unix timestamp in seconds. |
| `x-sidewalk-signature` | API | HMAC-SHA256 signature over the canonical request string. |

The canonical request string should be:

```text
METHOD
PATH
REQUEST_ID
ACCOUNT_ID
ISSUED_AT
SHA256_BODY
```

Use the raw request path without scheme or host. Use an empty body hash for `GET` requests.

## Shared secret configuration

Both services read the same internal secret from environment:

| Service | Variable | Required outside local |
| --- | --- | --- |
| `apps/api` | `STELLAR_SERVICE_SHARED_SECRET` | Yes |
| `apps/stellar-service` | `API_SERVICE_SHARED_SECRET` | Yes |

Local development may use a deterministic example secret from `.env.example`, but production and preview deployments must use generated secrets from the deployment platform.

## Verification behavior

The Stellar service should reject a protected request before any business logic when:

- `x-sidewalk-service` is missing or is not `api`.
- `x-sidewalk-account-id` is missing.
- `x-sidewalk-request-id` is missing or has already been accepted recently.
- `x-sidewalk-issued-at` is outside the accepted clock skew window.
- `x-sidewalk-signature` does not match the canonical request string.

Recommended first milestone defaults:

- Clock skew window: 120 seconds.
- Replay cache TTL: 5 minutes.
- Replay cache implementation: in-memory map for local/dev, replaceable adapter for deployed multi-instance environments.

## Local development flow

1. Copy the example env files for both services.
2. Set the same local shared secret in API and Stellar service env.
3. Start the API and Stellar service.
4. Exercise an API route that calls Stellar service.
5. Confirm Stellar service logs include the request id and account id but never log the shared secret or signature.

## Test matrix

| Test | Level | Expected result |
| --- | --- | --- |
| Valid signed API request | Service-integrated | Stellar service accepts and passes account context to the handler. |
| Missing service header | Service-integrated | Stellar service returns unauthorized before handler execution. |
| Missing account id | Service-integrated | Stellar service returns unauthorized before handler execution. |
| Tampered body with old signature | Service-integrated | Stellar service rejects signature mismatch. |
| Reused request id | Service-integrated | Stellar service rejects replay within replay TTL. |
| Expired issued-at timestamp | Service-integrated | Stellar service rejects stale request. |
| Local env secret mismatch | Service-integrated | Stellar service rejects all protected API calls until configuration matches. |

## Future wallet-aware identity

This handshake authenticates the API as the caller and carries an account id. It does not prove wallet ownership by itself. Future wallet provisioning should add a separate account-to-wallet binding contract, likely stored in shared types and verified by API before requesting Stellar actions.

Keep those responsibilities separate:

- API validates user session and account permissions.
- API signs internal service requests.
- Stellar service verifies the internal request proof.
- Wallet ownership is verified by a future wallet binding flow.
