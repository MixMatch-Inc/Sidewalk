'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getApiBaseUrl } from '../../lib/api';

type PublicReportDetail = {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  anchor_status: string;
  stellar_tx_hash: string | null;
  location_summary: string | null;
  history: Array<{ status: string; note: string | null; createdAt: string }>;
};

export function PublicReportDetail({ reportId }: Readonly<{ reportId: string }>) {
  const [report, setReport] = useState<PublicReportDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(`${getApiBaseUrl()}/api/reports/public/${reportId}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json() as Promise<PublicReportDetail>;
      })
      .then((payload) => { if (!cancelled && payload) setReport(payload); })
      .catch(() => { if (!cancelled) setError('Unable to load report'); });

    return () => { cancelled = true; };
  }, [reportId]);

  if (notFound) return (
    <section className="auth-card">
      <p className="status-note error">Report not found.</p>
      <Link className="button button-secondary" href="/reports">Back to reports</Link>
    </section>
  );

  if (error) return <p className="status-note error">{error}</p>;
  if (!report) return <p className="helper-copy">Loading report…</p>;

  return (
    <>
      <section className="auth-card detail-grid">
        <div>
          <p className="eyebrow">{report.category}</p>
          <h2>{report.title}</h2>
          <p className="lede compact-copy">{report.description}</p>
          {report.location_summary && <p className="helper-copy">📍 {report.location_summary}</p>}
        </div>
        <dl className="detail-list">
          <div><dt>Status</dt><dd>{report.status}</dd></div>
          <div><dt>Anchor</dt><dd>{report.anchor_status}</dd></div>
          <div><dt>Stellar tx</dt><dd>{report.stellar_tx_hash ?? 'Pending'}</dd></div>
        </dl>
      </section>

      <section className="auth-card">
        <h2>Public history</h2>
        {report.history.length === 0
          ? <p className="helper-copy">No history yet.</p>
          : (
            <ol className="timeline-list">
              {report.history.map((entry) => (
                <li key={`${entry.status}-${entry.createdAt}`}>
                  <strong>{entry.status}</strong>
                  {entry.note && <p>{entry.note}</p>}
                  <time>{new Date(entry.createdAt).toLocaleString()}</time>
                </li>
              ))}
            </ol>
          )}
        <Link className="button button-secondary" href="/reports">Back to reports</Link>
      </section>
    </>
  );
}
