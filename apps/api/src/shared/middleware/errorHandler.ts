import type { ErrorRequestHandler } from "express";

import { AppError } from "../errors/AppError.js";
import { logger } from "../logger/logger.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ code: err.code, message: err.message });
    return;
  }

  logger.error("Unhandled error", { error: err instanceof Error ? err.message : String(err) });
  res.status(500).json({ code: "INTERNAL_ERROR", message: "Something went wrong." });
};
