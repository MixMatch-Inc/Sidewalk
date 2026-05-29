/**
 * Baseline auth metrics — in-memory counters and latency buckets.
 *
 * Metric names follow the pattern:
 *   auth.<endpoint>.<outcome>          (counter)
 *   auth.<endpoint>.duration_ms_total  (cumulative ms, divide by count for avg)
 *
 * Endpoints: register | login | verify_email | logout | refresh | password_reset
 * Outcomes:  success | failure
 */

export type MetricSnapshot = {
  counters: Record<string, number>;
  /** Average latency in ms per endpoint (success + failure combined). */
  avg_duration_ms: Record<string, number>;
};

const counters: Record<string, number> = {};
const durationTotal: Record<string, number> = {};
const durationCount: Record<string, number> = {};

function inc(key: string): void {
  counters[key] = (counters[key] ?? 0) + 1;
}

function recordDuration(endpoint: string, ms: number): void {
  durationTotal[endpoint] = (durationTotal[endpoint] ?? 0) + ms;
  durationCount[endpoint] = (durationCount[endpoint] ?? 0) + 1;
}

export function recordAuthEvent(
  endpoint: string,
  outcome: "success" | "failure",
  durationMs: number
): void {
  inc(`auth.${endpoint}.${outcome}`);
  recordDuration(endpoint, durationMs);
}

export function getMetrics(): MetricSnapshot {
  const avg_duration_ms: Record<string, number> = {};
  for (const ep of Object.keys(durationCount)) {
    avg_duration_ms[ep] = Math.round(durationTotal[ep] / durationCount[ep]);
  }
  return { counters: { ...counters }, avg_duration_ms };
}

/** Reset all metrics — useful in tests. */
export function resetMetrics(): void {
  for (const k of Object.keys(counters)) delete counters[k];
  for (const k of Object.keys(durationTotal)) delete durationTotal[k];
  for (const k of Object.keys(durationCount)) delete durationCount[k];
}
