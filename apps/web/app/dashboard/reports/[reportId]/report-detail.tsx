'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { authenticatedJsonFetch } from '../../../lib/auth-fetch';

type ReportDetailResponse = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  anchor_status: string;
  integrity_flag: string;
  exif_verified: boolean;
  exif_distance_meters: number | null;
  stellar_tx_hash: string | null;
  snapshot_hash: string | null;
  media_urls: string[];
  history: Array<{
    type: string;
    status: string;
    note: string | null;
    createdAt: string;
  }>;
};

export function ReportDetail({ reportId }: Readonly<{ reportId: string }>) {
  const [report, setReport] = useState<ReportDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadReport = async () => {
      try {
        const payload = await authenticatedJsonFetch<ReportDetailResponse>(`/api/reports/${reportId}`);
        if (!cancelled) {
          setReport(payload);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load report');
        }
      }
    };

    void loadReport();

    return () => {
      cancelled = true;
    };
  }, [reportId]);

  if (error) {
    return <p className="status-note error">{error}</p>;
  }

  if (!report) {
    return <p className="helper-copy">Loading report…</p>;
  }

  return (
    <>
      <section className="auth-card detail-grid">
        <div>
          <p className="eyebrow">{report.category}</p>
          <h2>{report.title}</h2>
          <p className="lede compact-copy">{report.description}</p>
        </div>
        <dl className="detail-list">
          <div>
            <dt>Status</dt>
            <dd>{report.status}</dd>
          </div>
          <div>
            <dt>Anchor</dt>
            <dd>{report.anchor_status}</dd>
          </div>
          <div>
            <dt>Integrity</dt>
            <dd>{report.integrity_flag}</dd>
          </div>
          <div>
            <dt>EXIF verified</dt>
            <dd>{report.exif_verified ? 'Yes' : 'No'}</dd>
          </div>
        </dl>
      </section>

      <section className="surface-grid">
        <article className="surface-card">
          <h2>Media</h2>
          {report.media_urls.length === 0 ? (
            <p className="helper-copy">No media URLs attached to this report.</p>
          ) : (
            <ul className="link-list">
              {report.media_urls.map((url) => (
                <li key={url}>
                  <a href={url} target="_blank" rel="noreferrer">
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="surface-card">
          <h2>Anchor metadata</h2>
          <p className="helper-copy">Snapshot hash: {report.snapshot_hash ?? 'Pending'}</p>
          <p className="helper-copy">Stellar tx: {report.stellar_tx_hash ?? 'Queued'}</p>
          <p className="helper-copy">
            EXIF distance: {report.exif_distance_meters ?? 'Not available'}
          </p>
        </article>
      </section>

      <section className="auth-card">
        <div className="section-heading">
          <h2>History</h2>
          <Link className="button button-secondary" href="/dashboard/reports">
            Back to reports
          </Link>
        </div>
        <ol className="timeline-list">
          {report.history.map((entry) => (
            <li key={`${entry.type}-${entry.createdAt}`}>
              <strong>{entry.status}</strong>
              <p>{entry.note ?? entry.type}</p>
              <time>{new Date(entry.createdAt).toLocaleString()}</time>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
