import Link from 'next/link';

type HealthResponse = {
  status: string;
  timestamp?: string;
  redis_connected?: boolean;
  stellar_connected?: boolean;
  media_worker_ready?: boolean;
};

const fallback: HealthResponse = { status: 'unreachable' };

async function getHealth(): Promise<HealthResponse> {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5001').replace(/\/+$/, '');
  try {
    const res = await fetch(`${base}/api/health`, { cache: 'no-store' });
    if (!res.ok) return fallback;
    return (await res.json()) as HealthResponse;
  } catch {
    return fallback;
  }
}

function StatusRow({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className={warn ? 'status-note error' : undefined}>{value}</dd>
    </div>
  );
}

export default async function DiagnosticsPage() {
  const h = await getHealth();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5001';

  return (
    <main className="page-shell">
      <section className="hero compact">
        <p className="eyebrow">Diagnostics</p>
        <h1>Environment &amp; dependency status</h1>
        <p className="lede">Use this page to diagnose local setup issues before running a demo.</p>
      </section>

      <section className="health-card">
        <dl>
          <StatusRow label="API base URL" value={apiBase} />
          <StatusRow label="API status" value={h.status} warn={h.status !== 'ok'} />
          <StatusRow label="Redis" value={h.redis_connected == null ? 'unknown' : h.redis_connected ? 'connected' : 'disconnected'} warn={h.redis_connected === false} />
          <StatusRow label="Stellar" value={h.stellar_connected == null ? 'unknown' : h.stellar_connected ? 'connected' : 'disconnected'} warn={h.stellar_connected === false} />
          <StatusRow label="Media worker" value={h.media_worker_ready == null ? 'unknown' : h.media_worker_ready ? 'ready' : 'unavailable'} warn={h.media_worker_ready === false} />
          <StatusRow label="Last checked" value={h.timestamp ?? 'N/A'} />
        </dl>
      </section>

      {(h.redis_connected === false || h.stellar_connected === false) && (
        <section className="auth-card">
          <p className="status-note error">
            One or more dependencies are unavailable. Check your <code>.env</code> and see the{' '}
            <Link href="/docs/phase-1-demo-runbook.md">setup runbook</Link> for guidance.
          </p>
        </section>
      )}

      <section className="actions">
        <Link className="button button-primary" href="/health">Raw health JSON</Link>
        <Link className="button button-secondary" href="/">Return home</Link>
      </section>
    </main>
  );
}
