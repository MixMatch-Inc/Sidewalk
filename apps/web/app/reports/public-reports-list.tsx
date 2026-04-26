'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getApiBaseUrl } from '../lib/api';

type PublicReport = { _id: string; title: string; category: string; status: string; createdAt: string };
type Pagination = { page: number; totalPages: number };
type PublicListResponse = { data: PublicReport[]; pagination: Pagination };

const categoryOptions = ['ALL', 'INFRASTRUCTURE', 'SANITATION', 'SAFETY', 'LIGHTING', 'TRANSPORT', 'OTHER'];
const statusOptions = ['ALL', 'PENDING', 'ACKNOWLEDGED', 'RESOLVED'];

export function PublicReportsList() {
  const router = useRouter();
  const params = useSearchParams();
  const category = params.get('category') ?? 'ALL';
  const status = params.get('status') ?? 'ALL';
  const page = Number(params.get('page') ?? '1');

  const [reports, setReports] = useState<PublicReport[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const push = (updates: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === 'ALL') next.delete(k); else next.set(k, v);
    }
    if (!updates.page) next.set('page', '1');
    router.push(`?${next.toString()}`);
  };

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    const q = new URLSearchParams({ page: String(page), pageSize: '12' });
    if (category !== 'ALL') q.set('category', category);
    if (status !== 'ALL') q.set('status', status);

    fetch(`${getApiBaseUrl()}/api/reports/public?${q.toString()}`)
      .then((r) => r.json() as Promise<PublicListResponse>)
      .then((payload) => { if (!cancelled) { setReports(payload.data); setPagination(payload.pagination); } })
      .catch(() => { if (!cancelled) setError('Unable to load reports'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [category, status, page]);

  return (
    <>
      <section className="auth-card filter-row">
        <label className="field"><span>Category</span>
          <select value={category} onChange={(e) => push({ category: e.target.value })}>
            {categoryOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
        <label className="field"><span>Status</span>
          <select value={status} onChange={(e) => push({ status: e.target.value })}>
            {statusOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
      </section>

      {error && <p className="status-note error">{error}</p>}
      {isLoading && <p className="helper-copy">Loading reports…</p>}

      <section className="surface-grid report-grid">
        {reports.map((r) => (
          <article className="surface-card" key={r._id}>
            <p className="eyebrow">{r.category}</p>
            <h2>{r.title}</h2>
            <p className="helper-copy">{r.status} · {new Date(r.createdAt).toLocaleDateString()}</p>
            <Link className="button button-secondary" href={`/reports/${r._id}`}>View report</Link>
          </article>
        ))}
      </section>

      {!isLoading && reports.length === 0 && !error && <p className="helper-copy">No reports found.</p>}

      {pagination && pagination.totalPages > 1 && (
        <nav className="filter-row">
          <button disabled={page <= 1} onClick={() => push({ page: String(page - 1) })}>← Prev</button>
          <span className="helper-copy">Page {page} of {pagination.totalPages}</span>
          <button disabled={page >= pagination.totalPages} onClick={() => push({ page: String(page + 1) })}>Next →</button>
        </nav>
      )}
    </>
  );
}
