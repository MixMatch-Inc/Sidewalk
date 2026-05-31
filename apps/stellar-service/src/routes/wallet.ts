import { Router } from "express";
import type { AuthedRequest } from "../middleware/requireAuth.js";
import { stellarAuditLog } from "../services/stellarAuditLog.js";

export function makeWalletRouter(requireAuth: ReturnType<typeof import("../middleware/requireAuth.js").makeRequireAuth>): Router {
  const router = Router();

  /**
   * POST /wallet/bootstrap — Issue #417 + #419
   *
   * Starts wallet setup for the authenticated, verified account.
   * Auth gating ensures stale/revoked sessions and unverified accounts are
   * rejected before any Stellar work begins.
   * An audit event is emitted regardless of outcome for traceability.
   */
  router.post("/bootstrap", requireAuth, (req, res) => {
    const { accountId, sessionId } = (req as AuthedRequest).auth;
    const requestId = req.header("x-request-id") ?? "none";

    // Placeholder: real bootstrap logic (keypair generation, funding, etc.) goes here.
    // Emitting the audit event before the work begins so a failure mid-bootstrap is
    // still traceable. A second event with outcome "success" or "failure" should be
    // emitted once the async work completes.
    stellarAuditLog(accountId, requestId, "wallet_bootstrap", "success", {
      sessionId: sessionId.slice(0, 8) + "…" // partial — enough for correlation, not replay
    });

    res.status(202).json({ message: "Wallet bootstrap initiated.", accountId });
  });

  return router;
}
