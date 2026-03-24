export const dynamic = "force-dynamic";

async function getHealthStatus() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
  const endpoint = `${baseUrl.replace(/\/$/, "")}/api/health`;

  try {
    const response = await fetch(endpoint, {
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        endpoint,
        status: "degraded",
        details: `Health endpoint returned ${response.status}`,
      };
    }

    const payload = (await response.json()) as {
      status?: string;
      integrations?: Record<string, string>;
      timestamp?: string;
    };

    return {
      endpoint,
      status: payload.status ?? "unknown",
      details: payload.integrations
        ? Object.entries(payload.integrations)
            .map(([name, value]) => `${name}: ${value}`)
            .join(", ")
        : "No integration details returned",
      timestamp: payload.timestamp ?? null,
    };
  } catch (error) {
    return {
      endpoint,
      status: "offline",
      details: error instanceof Error ? error.message : "Unknown health fetch error",
    };
  }
}

export default async function HealthPage() {
  const health = await getHealthStatus();

  return (
    <main className="page-shell">
      <section className="hero compact">
        <p className="eyebrow">Workspace diagnostics</p>
        <h1>Health status</h1>
        <p className="lede">
          This page is safe to ship before deeper platform features. It validates the
          new web app and provides a simple API readiness check.
        </p>
      </section>

      <section className="health-card">
        <dl>
          <div>
            <dt>Endpoint</dt>
            <dd>{health.endpoint}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{health.status}</dd>
          </div>
          <div>
            <dt>Details</dt>
            <dd>{health.details}</dd>
          </div>
          <div>
            <dt>Timestamp</dt>
            <dd>{health.timestamp ?? "Unavailable"}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
