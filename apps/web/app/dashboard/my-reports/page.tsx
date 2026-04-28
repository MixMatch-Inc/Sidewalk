'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { authenticatedJsonFetch } from '../../lib/auth-fetch';

type Report = {
  id: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type ReportListResponse = { data: Report[]; total: number };

const STATUS_OPTIONS = ['ALL', 'PENDING', 'ACKNOWLEDGED', 'RESOLVED', 'REJECTED', 'ESCALATED'];

export default function MyReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ page: '1', pageSize: '20' });
    if (status !== 'ALL') params.set('status', status);
    if (search) params.set('search', search);

    authenticatedJsonFetch<ReportListResponse>(`/api/reports/mine?${params}`)
      .then((res) => { if (!cancelled) setReports(res.data); })
      .catch((err: unknown) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [status, search]);

  return (
    <main className="dashboard-main">
      <h1>My Reports</h1>

      <section className="auth-card filter-row">
        <input
          className="field"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <Link className="button button-primary" href="/dashboard/reports/new">New report</Link>
      </section>

      {error && <p className="status-note error">{error}</p>}
      {loading && <p className="helper-copy">Loading…</p>}

      <section className="surface-grid report-grid">
        {reports.map((r) => (
          <article className="surface-card" key={r.id}>
            <p className="eyebrow">{r.category}</p>
            <h2>{r.title}</h2>
            <p className="helper-copy">{r.status} · {new Date(r.updated_at).toLocaleDateString()}</p>
            <Link className="button button-secondary" href={`/dashboard/reports/${r.id}`}>View</Link>
          </article>
        ))}
      </section>

      {!loading && reports.length === 0 && !error && (
        <p className="helper-copy">No reports yet.</p>
      )}
    </main>
  );
}
