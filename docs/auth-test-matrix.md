# Cross-workspace auth test matrix

This matrix defines the first milestone of authentication coverage across the API, web app, mobile app, and Stellar service. It is intentionally scoped for hackathon contributors: start with the paths that protect account access and service trust, then expand into wallet-aware identity when those contracts exist.

## Coverage levels

| Level | Scope | Purpose |
| --- | --- | --- |
| API-only | `apps/api` request/response behavior | Validate auth primitives without UI or service dependencies. |
| Web + API | `apps/web` user journey backed by `apps/api` | Verify contributor-facing browser flows and API contracts. |
| Mobile + API | `apps/mobile` user journey backed by `apps/api` | Verify mobile account flows and session handling. |
| Service-integrated | `apps/api` plus `apps/stellar-service` | Verify trusted service context before Stellar-linked actions. |

## Priority matrix

| Priority | Journey | Coverage level | Workspaces | Acceptance signal |
| --- | --- | --- | --- | --- |
| P0 | Register with valid email and password | API-only | `apps/api` | `POST /auth/register` returns account data and does not expose password material. |
| P0 | Reject duplicate registration | API-only | `apps/api` | Duplicate email returns a stable conflict error. |
| P0 | Login with valid credentials | API-only | `apps/api` | `POST /auth/login` returns access and refresh tokens. |
| P0 | Reject invalid login | API-only | `apps/api` | Wrong password and unknown account return unauthorized errors without leaking which field failed. |
| P0 | Refresh active session | API-only | `apps/api` | `POST /auth/refresh` rotates the refresh token and rejects reused tokens. |
| P0 | Logout current session | API-only | `apps/api` | Authenticated `POST /auth/logout` revokes the active session and rejects repeated logout. |
| P0 | Logout all sessions | API-only | `apps/api` | Authenticated `POST /auth/logout/all` revokes all sessions for the account and leaves other accounts untouched. |
| P1 | Web signup happy path | Web + API | `apps/web`, `apps/api` | A new web user can submit signup, see an authenticated state, and receive API validation errors inline. |
| P1 | Web login and logout | Web + API | `apps/web`, `apps/api` | Existing user can log in, persist session across refresh, and log out. |
| P1 | Mobile signup happy path | Mobile + API | `apps/mobile`, `apps/api` | Mobile user can submit signup and receive typed success/error states from the API. |
| P1 | Mobile login and logout | Mobile + API | `apps/mobile`, `apps/api` | Mobile session survives app foreground/background cycle and can be revoked. |
| P1 | Expired or revoked access token | Web + API, Mobile + API | `apps/web`, `apps/mobile`, `apps/api` | Clients route users back to login and do not keep stale authenticated UI state. |
| P2 | API requests Stellar service with trusted context | Service-integrated | `apps/api`, `apps/stellar-service` | Stellar service accepts only calls carrying the agreed internal service proof and account context. |
| P2 | Stellar service rejects missing or malformed trust context | Service-integrated | `apps/api`, `apps/stellar-service` | Requests without the internal proof fail before any wallet or receipt action. |
| P2 | Wallet-aware account binding placeholder | Service-integrated | `apps/api`, `apps/stellar-service`, `packages/types` | Test plan names the future contract for linking `accountId` to Stellar public key without requiring implementation in the first batch. |

## First milestone focus

Contributors should complete the P0 API-only tests before adding UI coverage. These tests already give the rest of the repo a stable auth contract to build against.

After P0 is stable, add P1 web and mobile journeys around the same API behavior. Avoid duplicating every validation branch in every client; use client tests for rendering and routing behavior, and API tests for auth business rules.

P2 service-integrated coverage should start as contract or integration tests once the API-to-Stellar trust mechanism is defined. Until then, treat it as a documented target so service work does not invent incompatible auth assumptions.

## Suggested test ownership

| Owner area | Responsible paths | Primary tests |
| --- | --- | --- |
| API auth | `apps/api/src/app.ts`, `apps/api/src/__tests__` | Registration, login, refresh, logout, logout-all, token error handling. |
| Web auth | `apps/web/app`, future web auth components | Signup/login/logout UI state, API error rendering, refresh handling. |
| Mobile auth | `apps/mobile`, future mobile auth screens | Signup/login/logout UI state, app lifecycle session handling. |
| Stellar trust | `apps/stellar-service/src`, future API service client | Internal request proof, account context validation, rejection paths. |

## Definition of done

- Each auth journey maps to exactly one coverage level.
- P0 paths have automated API tests before UI work depends on them.
- P1 paths test client behavior without re-testing all API internals.
- P2 paths identify the service trust boundary and the expected rejection behavior.
- Future auth issues can reference this matrix instead of redefining cross-workspace coverage.
