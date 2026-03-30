type LogLevel = "info" | "warn" | "error";

type LogValue = string | number | boolean | null | undefined | Record<string, unknown> | unknown[];

const REDACT_KEYS = new Set(["password", "token", "authorization", "email"]);

const redact = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(redact);
  }

  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    for (const [key, inner] of Object.entries(obj)) {
      if (REDACT_KEYS.has(key.toLowerCase())) {
        result[key] = "[REDACTED]";
        continue;
      }
      result[key] = redact(inner);
    }

    return result;
  }

  return value;
};

const write = (level: LogLevel, message: string, context?: Record<string, LogValue>): void => {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(context ? { context: redact(context) } : {}),
  };

  process.stdout.write(`${JSON.stringify(payload)}\n`);
};

export const logger = {
  info: (message: string, context?: Record<string, LogValue>): void => write("info", message, context),
  warn: (message: string, context?: Record<string, LogValue>): void => write("warn", message, context),
  error: (message: string, context?: Record<string, LogValue>): void => write("error", message, context),
  child:
    (baseContext: Record<string, LogValue>) =>
    ({
      info: (message: string, context?: Record<string, LogValue>) =>
        write("info", message, { ...baseContext, ...(context ?? {}) }),
      warn: (message: string, context?: Record<string, LogValue>) =>
        write("warn", message, { ...baseContext, ...(context ?? {}) }),
      error: (message: string, context?: Record<string, LogValue>) =>
        write("error", message, { ...baseContext, ...(context ?? {}) }),
    }) as const,
};
