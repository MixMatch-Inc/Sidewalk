import { randomUUID } from "crypto";
import { RequestHandler } from "express";
import { logger } from "./logger";

export const requestLogger: RequestHandler = (req, res, next) => {
  const start = Date.now();
  req.requestId = randomUUID();

  res.on("finish", () => {
    logger.info("HTTP request completed", {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
      ip: req.ip,
      userAgent: req.headers["user-agent"] ?? null,
      authorization: req.headers.authorization ?? null,
      userId: req.user?.id ?? null,
    });
  });

  next();
};
