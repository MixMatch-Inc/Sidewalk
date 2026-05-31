# Auth Audit Retention Policy

## Current audit events

The API currently emits structured log events for the following auth actions:

| Event | Trigger |
|---|---|
| `LOGIN_SUCCESS` | Successful credential check |
| `LOGIN_FAILURE` | Failed credential check |
| `ACCOUNT_LOCKED` | Failed-login threshold reached |
| `REFRESH_REUSE_DETECTED` | Rotated refresh token reused |
| `PASSWORD_RESET_REQUESTED` | Reset link requested |
| `PASSWORD_RESET_COMPLETED` | Reset link consumed |
| `EMAIL_VERIFIED` | Verification token consumed |
| `LOGOUT` | Explicit logout |
| `LOGOUT_ALL` | All sessions revoked |

## Retention periods

| Category | Retention | Rationale |
|---|---|---|
| Security signals (`LOGIN_FAILURE`, `ACCOUNT_LOCKED`, `REFRESH_REUSE_DETECTED`) | 90 days | Long enough to correlate attack patterns across sessions |
| Normal auth activity (`LOGIN_SUCCESS`, `LOGOUT`, `LOGOUT_ALL`) | 30 days | Useful for debugging; low privacy risk |
| Sensitive recovery events (`PASSWORD_RESET_*`, `EMAIL_VERIFIED`) | 90 days | Needed for abuse investigation and support |

## What is logged

Each event includes:

- Event type
- Timestamp (UTC)
- Account ID (not email) where applicable
- Request origin / IP (hashed or truncated in production)
- Outcome

Passwords, tokens, and raw email addresses are **never** written to audit logs.

## Storage in the MVP starter

Audit events are written to structured stdout logs. There is no dedicated audit database in the MVP.

In local development, logs are ephemeral (process lifetime). In a deployed environment, pipe stdout to a log aggregator (e.g., CloudWatch, Datadog, Loki) and apply the retention periods above at the aggregator level.

## Tradeoffs

- **No persistent audit store in MVP:** Keeps the starter simple and avoids a database dependency for hackathon contributors. The tradeoff is that logs are lost on process restart locally.
- **IP hashing deferred:** Raw IPs are logged in development. Production deployments should hash or truncate IPs before writing to comply with privacy expectations.
- **30/90-day split:** Balances debugging value against storage cost and privacy. Adjust upward if a compliance requirement demands it.

## Updating this policy

When the product moves beyond the hackathon starter phase:

1. Introduce a dedicated audit log table or stream.
2. Enforce retention via a scheduled cleanup job (see `AUTH_RECOVERY_TTL_CLEANUP.md` for the pattern).
3. Add events for new auth surfaces (identity, wallet provisioning, admin actions).
4. Review IP/PII handling against the applicable privacy regulation.
