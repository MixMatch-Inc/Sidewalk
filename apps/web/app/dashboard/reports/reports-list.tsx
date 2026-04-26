'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authenticatedJsonFetch } from '../../lib/auth-fetch';

type ReportSummary = {
  _id: string;
  title: string;
  category: string;
  status: string;
  anchorStatus: string;
  integrityFlag: string;
  createdAt: string;
};

type Pagination = { page: number; pageSize: number; total: number; totalPages: number };
type ReportListResponse = { data: ReportSummary[]; pagination: Pagination };

const statusOptions = ['ALL', 'PENDING', 'ACKNOWLEDGED', 'RESOLVED', 'REJECTED', 'ESCALATED'];
const categoryOptions = ['ALL', 'INFRASTRUCTURE', 'SANITATION', 'SAFETY', 'LIGHTING', 'TRANSPORT', 'DRAINAGE', 'UTILITIES', 'TRAFFIC', 'OTHER'];
const sortOptions = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'status:asc', label: 'Status A–Z' },
];

export function ReportsList() {
  const router = useRouter();
  const params = useSearchParams();

  const status = params.get('status') ?? 'ALL';
  const category = params.get('category') ?? 'ALL';
  const sort = params.get('sort') ?? 'createdAt:desc';
  const page = Number(params.get('page') ?? '1');

  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const push = (updates: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === 'ALL' || v === '') next.delete(k);
      else next.set(k, v);
    }
    if (updates.page === undefined) next.set('page', '1');
    router.push(`?${next.toString()}`);
  };

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const [sortField, sortDir] = sort.split(':');
    const query = new URLSearchParams({ page: String(page), pageSize: '12', sortField: sortField ?? 'createdAt', sortDir: sortDir ?? 'desc' });
    if (status !== 'ALL') query.set('status', status);
    if (category !== 'ALL') query.set('category', category);

    authenticatedJsonFetch<ReportListResponse>(`/api/reports?${query.toString()}`)
      .then((payload) => {
        if (!cancelled) { setReports(payload.data); setPagination(payload.pagination); }
      })
      .catch((err) => {
        if (!cancelled) { setError(err instanceof Error ? err.message : 'Unable to load reports'); setReports([]); }
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [status, category, sort, page]);

  return (
    <>
      <section className="auth-card filter-row">
        <label className="field"><span>Status</span>
          <select value={status} onChange={(e) => push({ status: e.target.value })}>
            {statusOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
        <label className="field"><span>Category</span>
          <select value={category} onChange={(e) => push({ category: e.target.value })}>
            {categoryOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
        <label className="field"><span>Sort</span>
          <select value={sort} onChange={(e) => push({ sort: e.target.value })}>
            {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <Link className="button button-primary" href="/dashboard/reports/new">Submit report</Link>
      </section>

      {error ? <p className="status-note error">{error}</p> : null}
      {isLoading ? <p className="helper-copy">Loading reports…</p> : null}

      <section className="surface-grid report-grid">
        {reports.map((report) => (
          <article className="surface-card" key={report._id}>
            <p className="eyebrow">{report.category}</p>
            <h2>{report.title}</h2>
            <p className="helper-copy">{report.status} · {report.anchorStatus}</p>
            <p className="helper-copy">{new Date(report.createdAt).toLocaleString()}</p>
            {report.integrityFlag !== 'NORMAL' && <p className="status-note error">Integrity flag: {report.integrityFlag}</p>}
            <Link className="button button-secondary" href={`/dashboard/reports/${report._id}`}>Open report</Link>
          </article>
        ))}
      </section>

      {!isLoading && reports.length === 0 && !error && (
        <p className="helper-copy">No reports matched the current filters.</p>
      )}

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
