/**
 * Minimal error-reporting abstraction for background workers.
 * Ships a no-op adapter for local dev; swap in a hosted sink via ERROR_SINK_URL.
 * Closes #199
 */

export interface ErrorContext {
  worker: string;
  jobId?: string | number;
  [key: string]: unknown;
}

export interface ErrorReporter {
  capture(err: unknown, ctx: ErrorContext): void;
}

class NoopReporter implements ErrorReporter {
  capture(err: unknown, ctx: ErrorContext): void {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[worker:${ctx.worker}] job=${ctx.jobId ?? "?"} error: ${message}`, ctx);
  }
}

class HttpReporter implements ErrorReporter {
  constructor(private readonly sinkUrl: string) {}

  capture(err: unknown, ctx: ErrorContext): void {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    const body = JSON.stringify({ message, stack, ...ctx, ts: new Date().toISOString() });

    fetch(this.sinkUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    }).catch((e) => console.error("[error-reporter] delivery failed:", e));

    // Still log locally so dev output is not silent
    console.error(`[worker:${ctx.worker}] job=${ctx.jobId ?? "?"} error: ${message}`);
  }
}

function createReporter(): ErrorReporter {
  const url = process.env.ERROR_SINK_URL;
  return url ? new HttpReporter(url) : new NoopReporter();
}

export const errorReporter: ErrorReporter = createReporter();
