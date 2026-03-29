import Link from 'next/link';

type HealthResponse = {
  status: string;
  timestamp?: string;
  redis_connected?: boolean;
  stellar_connected?: boolean;
};

const fallbackHealth: HealthResponse = {
  status: 'unknown',
};

async function getHealth(): Promise<HealthResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5001';

  try {
    const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/api/health`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return fallbackHealth;
    }

    return (await response.json()) as HealthResponse;
  } catch {
    return fallbackHealth;
  }
}

export default async function DiagnosticsPage() {
  const health = await getHealth();

  return (
    <main className="page-shell">
      <section className="hero compact">
        <p className="eyebrow">Diagnostics</p>
        <h1>Check demo readiness.</h1>
        <p className="lede">
          Use this page during QA or demos to confirm the API, Redis-backed workers, and
          Stellar connectivity are reachable from the web app.
        </p>
      </section>

      <section className="health-card">
        <dl>
          <div>
            <dt>API status</dt>
            <dd>{health.status}</dd>
          </div>
          <div>
            <dt>Redis</dt>
            <dd>{String(health.redis_connected ?? 'unknown')}</dd>
          </div>
          <div>
            <dt>Stellar</dt>
            <dd>{String(health.stellar_connected ?? 'unknown')}</dd>
          </div>
          <div>
            <dt>Timestamp</dt>
            <dd>{health.timestamp ?? 'Unavailable'}</dd>
          </div>
        </dl>
      </section>

      <section className="actions">
        <Link className="button button-primary" href="/health">
          Open raw health page
        </Link>
        <Link className="button button-secondary" href="/">
          Return home
        </Link>
      </section>
    </main>
  );
}
