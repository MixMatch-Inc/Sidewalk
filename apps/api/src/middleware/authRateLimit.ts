/**
 * Auth-specific rate limiting — in-memory, no external dependencies.
 *
 * Different auth flows get different thresholds:
 *   login / register  → 10 req / 15 min
 *   password reset    → 5  req / 15 min
 *   verify resend     → 5  req / 15 min
 *
 * In the test environment the app-level limiters are no-ops to prevent
 * cross-test interference. Rate-limit behaviour is verified separately
 * using makeRateLimiter with a fresh instance.
 */

import type { Request, Response, NextFunction } from "express";
import type { AuthErrorResponse } from "@sidewalk/types";

type Bucket = { count: number; resetAt: number };

export function makeRateLimiter(max: number, windowMs: number) {
  const buckets = new Map<string, Bucket>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip ?? "unknown";
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now > bucket.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (bucket.count >= max) {
      const err: AuthErrorResponse = { code: "RATE_LIMITED", message: "Too many requests. Please try again later." };
      res.status(429).json(err);
      return;
    }

    bucket.count++;
    next();
  };
}

const WINDOW = 15 * 60 * 1000; // 15 minutes
const IS_TEST = process.env.APP_ENV === "test";
const passThrough = (_req: Request, _res: Response, next: NextFunction) => next();

export const loginRateLimit = IS_TEST ? passThrough : makeRateLimiter(10, WINDOW);
export const registerRateLimit = IS_TEST ? passThrough : makeRateLimiter(10, WINDOW);
export const resetRateLimit = IS_TEST ? passThrough : makeRateLimiter(5, WINDOW);
export const verifyResendRateLimit = IS_TEST ? passThrough : makeRateLimiter(5, WINDOW);
