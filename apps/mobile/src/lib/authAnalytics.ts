/**
 * Mobile auth analytics (#382).
 *
 * Emits named events for key auth funnel actions. Payloads are intentionally
 * minimal — no credentials, raw tokens, or unnecessary personal data.
 *
 * Drop-in replacement: swap `defaultSink` for your analytics provider
 * (Segment, PostHog, Amplitude, etc.) without touching call sites.
 */

export type AuthAnalyticsEvent =
  | { name: "auth_login_attempted" }
  | { name: "auth_login_succeeded" }
  | { name: "auth_login_failed"; reason: string }
  | { name: "auth_logout" }
  | { name: "auth_register_attempted" }
  | { name: "auth_register_succeeded" }
  | { name: "auth_register_failed"; reason: string }
  | { name: "auth_reset_requested" }
  | { name: "auth_reset_completed" }
  | { name: "auth_verify_email_opened" }
  | { name: "auth_deep_link_opened"; linkType: "reset" | "verify" };

export type AnalyticsSink = (event: AuthAnalyticsEvent) => void;

let activeSink: AnalyticsSink = (event) => {
  if (__DEV__) {
    console.log("[auth:analytics]", event.name, event);
  }
};

/** Replace the default sink with your analytics provider. */
export function setAnalyticsSink(sink: AnalyticsSink): void {
  activeSink = sink;
}

export function trackAuthEvent(event: AuthAnalyticsEvent): void {
  try {
    activeSink(event);
  } catch {
    // Analytics must never crash the auth flow.
  }
}
