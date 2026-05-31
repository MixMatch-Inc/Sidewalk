/**
 * stellarAuditLog — Issue #419
 *
 * Structured audit logger for stellar-service actions that are linked to an
 * authenticated account. Mirrors the shape of the API-side authAuditLog so
 * events from both services are consistent and traceable.
 *
 * Recorded fields:
 *   - event prefix "stellar.audit" distinguishes these from API auth events
 *   - action: the specific Stellar operation attempted
 *   - outcome: success | failure
 *   - accountId: the verified account that initiated the action (never a secret)
 *   - requestId: forwarded from the inbound request for cross-service tracing
 *   - timestamp: ISO-8601
 *   - metadata: caller-supplied context (must not contain secrets or key material)
 */

export type StellarAction = "wallet_bootstrap";

export function stellarAuditLog(
  accountId: string,
  requestId: string,
  action: StellarAction,
  outcome: "success" | "failure",
  metadata: Record<string, unknown> = {}
): void {
  const payload = {
    event: "stellar.audit",
    action,
    outcome,
    accountId,
    requestId,
    timestamp: new Date().toISOString(),
    ...metadata
  };
  console.info(JSON.stringify(payload));
}
