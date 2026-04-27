import { randomUUID } from "crypto";
import type { Request, Response, NextFunction } from "express";

export const CORRELATION_HEADER = "x-correlation-id";

/** Attach a correlation ID to every request and expose it on res.locals. */
export function correlationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const id =
    (req.headers[CORRELATION_HEADER] as string | undefined) ?? randomUUID();
  res.locals.correlationId = id;
  res.setHeader(CORRELATION_HEADER, id);
  next();
}

/** Return the correlation ID stored on res.locals, or a fallback. */
export function getCorrelationId(res: Response): string {
  return (res.locals.correlationId as string | undefined) ?? "unknown";
}

/**
 * Enrich a log object with the correlation ID so every log line
 * emitted inside a request handler carries the same trace token.
 *
 * Usage:
 *   logger.info(withCorrelation(res, { event: "report.created", reportId }));
 */
export function withCorrelation(
  res: Response,
  payload: Record<string, unknown>
): Record<string, unknown> {
  return { correlationId: getCorrelationId(res), ...payload };
}

/**
 * Attach a correlation ID to a BullMQ job's data so worker logs
 * can reference the originating request.
 */
export function jobCorrelationData(res: Response): { correlationId: string } {
  return { correlationId: getCorrelationId(res) };
}
