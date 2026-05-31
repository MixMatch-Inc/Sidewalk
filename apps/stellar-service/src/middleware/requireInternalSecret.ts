import type { Request, Response, NextFunction } from "express";
import { timingSafeEqual } from "crypto";

/**
 * Rejects requests that do not carry the correct internal service secret.
 * Apply to any route that acts on account-linked data.
 * See STELLAR_SERVICE_AUTH.md for the full handshake design.
 */
export function requireInternalSecret(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const expected = process.env.STELLAR_INTERNAL_SECRET;
  const provided = req.headers["x-internal-secret"];

  if (!expected || typeof provided !== "string") {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);

  if (
    expectedBuf.length !== providedBuf.length ||
    !timingSafeEqual(expectedBuf, providedBuf)
  ) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}
