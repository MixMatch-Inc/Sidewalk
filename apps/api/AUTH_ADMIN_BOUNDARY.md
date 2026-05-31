# Admin and Moderation Auth Boundary

Closes #440

## Decision

Admin and moderation access will share the same authentication flow as general users in the MVP. Privilege is expressed through a `role` field on the account, not through a separate login surface.

## Rationale

- A separate admin login URL adds surface area and complexity before admin features exist.
- Role-based access control on a shared token is the standard pattern and is straightforward to extend.
- The starter's initial role model (`user`, `admin`, `moderator`) is simple enough that a single flow handles all cases cleanly.

## Role model baseline

| Role | Description |
|---|---|
| `user` | Default for all registered accounts |
| `moderator` | Can review and action reported content |
| `admin` | Full privileged access; can manage roles and configuration |

Roles are stored on the account record. The API access token payload includes the role so route middleware can enforce it without an extra database lookup.

## What this means for auth routes

- No new login endpoint for admins. `POST /auth/login` is the single entry point.
- Route middleware checks `req.user.role` for protected admin/moderation routes.
- Attempting to access a privileged route without the required role returns `403 FORBIDDEN`.
- Role assignment is an out-of-band operation (direct database update or a future admin API). There is no self-service role elevation.

## What is explicitly deferred

- A dedicated admin portal with its own subdomain or path prefix.
- Multi-factor authentication requirements for privileged roles (planned as a hardening pass).
- Audit logging of role changes (to be added when the admin milestone lands; follow the pattern in `AUTH_AUDIT_RETENTION.md`).
- IP allowlisting for admin access.

## Compatibility with the starter

The `packages/types/src/auth.ts` contract should include `role` on the account type. When the admin milestone lands, route guards can be added without touching the auth flow itself.

## Reference

Later moderation and admin issues should reference this document when deciding whether a new privileged capability needs its own auth surface. The answer is no unless there is a concrete security requirement that the shared flow cannot satisfy.
