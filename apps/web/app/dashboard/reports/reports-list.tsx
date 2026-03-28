'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { authenticatedJsonFetch } from '../../lib/auth-fetch';

type ReportSummary = {
  id: string;
  title: string;
  category: string;
  status: string;
  anchor_status: string;
  integrity_flag: string;
  created_at: string;
};

type ReportListResponse = {
  page: number;
  pageSize: number;
  total: number;
  data: ReportSummary[];
};

const statusOptions = ['ALL', 'PENDING', 'ACKNOWLEDGED', 'RESOLVED', 'REJECTED', 'ESCALATED'];
const categoryOptions = [
  'ALL',
  'INFRASTRUCTURE',
  'SANITATION',
  'SAFETY',
  'LIGHTING',
  'TRANSPORT',
  'DRAINAGE',
  'UTILITIES',
  'TRAFFIC',
  'OTHER',
];

export function ReportsList() {
  const [status, setStatus] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadReports = async () => {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: '1',
        pageSize: '12',
      });

      if (status !== 'ALL') {
        params.set('status', status);
      }

      if (category !== 'ALL') {
        params.set('category', category);
      }

      try {
        const payload = await authenticatedJsonFetch<ReportListResponse>(
          `/api/reports?${params.toString()}`,
        );

        if (!cancelled) {
          setReports(payload.data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load reports');
          setReports([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadReports();

    return () => {
      cancelled = true;
    };
  }, [category, status]);

  return (
    <>
      <section className="auth-card filter-row">
        <label className="field">
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <Link className="button button-primary" href="/dashboard/reports/new">
          Submit report
        </Link>
      </section>

      {error ? <p className="status-note error">{error}</p> : null}
      {isLoading ? <p className="helper-copy">Loading reports…</p> : null}

      <section className="surface-grid report-grid">
        {reports.map((report) => (
          <article className="surface-card" key={report.id}>
            <p className="eyebrow">{report.category}</p>
            <h2>{report.title}</h2>
            <p className="helper-copy">
              {report.status} · {report.anchor_status}
            </p>
            <p className="helper-copy">
              {new Date(report.created_at).toLocaleString()}
            </p>
            {report.integrity_flag !== 'NORMAL' ? (
              <p className="status-note error">Integrity flag: {report.integrity_flag}</p>
            ) : null}
            <Link className="button button-secondary" href={`/dashboard/reports/${report.id}`}>
              Open report
            </Link>
          </article>
        ))}
      </section>

      {!isLoading && reports.length === 0 && !error ? (
        <p className="helper-copy">No reports matched the current filters.</p>
      ) : null}
    </>
  );
}
