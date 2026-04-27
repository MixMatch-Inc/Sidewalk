import type { Request, Response, NextFunction } from "express";

interface Counter {
  total: number;
  success: number;
  failure: number;
  totalLatencyMs: number;
}

const counters: Record<string, Counter> = {};

function bucket(key: string): Counter {
  if (!counters[key]) {
    counters[key] = { total: 0, success: 0, failure: 0, totalLatencyMs: 0 };
  }
  return counters[key];
}

/** Record a completed operation into the named bucket. */
export function record(key: string, success: boolean, latencyMs: number): void {
  const c = bucket(key);
  c.total += 1;
  c.totalLatencyMs += latencyMs;
  if (success) c.success += 1;
  else c.failure += 1;
}

/** Return a snapshot of all collected metrics. */
export function snapshot(): Record<string, Counter & { avgLatencyMs: number }> {
  return Object.fromEntries(
    Object.entries(counters).map(([k, v]) => [
      k,
      { ...v, avgLatencyMs: v.total ? v.totalLatencyMs / v.total : 0 },
    ])
  );
}

/**
 * Express middleware that auto-instruments every route.
 * Buckets are keyed by "<METHOD> <route-pattern>" when available,
 * falling back to the raw path.
 */
export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();
  res.on("finish", () => {
    const key = `${req.method} ${req.route?.path ?? req.path}`;
    record(key, res.statusCode < 400, Date.now() - start);
  });
  next();
}
