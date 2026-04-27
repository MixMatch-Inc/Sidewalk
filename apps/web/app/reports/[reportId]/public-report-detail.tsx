'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getApiBaseUrl } from '../../lib/api';

type PublicReportDetail = {
  id: string;
  public_slug: string;
  title: string;
  description: string;
  category: string;
  status: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  media_urls: string[];
  createdAt: string;
  updatedAt: string;
  stellar_tx_hash?: string;
  anchor_status?: string;
  integrity_flag?: string;
  exif_verified?: boolean;
  exif_distance_meters?: number;
};

export function PublicReportDetail({ reportId }: Readonly<{ reportId: string }>) {
  const [report, setReport] = useState<PublicReportDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Try slug-based endpoint first, fall back to ID-based for backward compatibility
    const fetchReport = async () => {
      try {
        // Try slug endpoint first
        const slugResponse = await fetch(`${getApiBaseUrl()}/api/reports/public/slug/${reportId}`);
        
        if (slugResponse.status === 404) {
          // Try legacy ID endpoint
          const idResponse = await fetch(`${getApiBaseUrl()}/api/reports/public/id/${reportId}`);
          
          if (idResponse.status === 404) {
            setNotFound(true);
            return;
          }
          
          if (idResponse.redirected) {
            // Follow redirect to slug-based URL
            window.location.href = idResponse.url;
            return;
          }
          
          const payload = await idResponse.json();
          if (!cancelled && payload.success) {
            setReport(payload.data);
          }
        } else if (slugResponse.ok) {
          const payload = await slugResponse.json();
          if (!cancelled && payload.success) {
            setReport(payload.data);
          }
        } else {
          throw new Error('Failed to load report');
        }
      } catch (err) {
        if (!cancelled) {
          setError('Unable to load report');
        }
      }
    };

    fetchReport();

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

  const formatCoordinates = (coords: [number, number]) => {
    return `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`; // lat, lng
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <>
      <section className="auth-card detail-grid">
        <div>
          <p className="eyebrow">{report.category}</p>
          <h2>{report.title}</h2>
          <p className="lede compact-copy">{report.description}</p>
          <p className="helper-copy">📍 {formatCoordinates(report.location.coordinates)}</p>
          <p className="helper-copy">� Public ID: {report.public_slug}</p>
        </div>
        <dl className="detail-list">
          <div><dt>Status</dt><dd>{report.status}</dd></div>
          <div><dt>Created</dt><dd>{formatDate(report.createdAt)}</dd></div>
          <div><dt>Last Updated</dt><dd>{formatDate(report.updatedAt)}</dd></div>
          {report.anchor_status && (
            <div><dt>Anchor</dt><dd>{report.anchor_status}</dd></div>
          )}
          {report.stellar_tx_hash && (
            <div><dt>Stellar tx</dt><dd>{report.stellar_tx_hash}</dd></div>
          )}
          {report.integrity_flag === 'SUSPICIOUS' && (
            <div><dt>Integrity</dt><dd className="warning">{report.integrity_flag}</dd></div>
          )}
        </dl>
      </section>

      {report.media_urls.length > 0 && (
        <section className="auth-card">
          <h2>Evidence</h2>
          <div className="media-grid">
            {report.media_urls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Evidence ${index + 1}`}
                className="media-item"
                loading="lazy"
              />
            ))}
          </div>
        </section>
      )}

      <section className="auth-card">
        <h2>Share this report</h2>
        <div className="share-section">
          <input
            type="text"
            value={window.location.href}
            readOnly
            className="share-input"
            onClick={(e) => e.currentTarget.select()}
          />
          <button
            className="button button-secondary"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Link copied to clipboard!');
            }}
          >
            Copy Link
          </button>
        </div>
        <Link className="button button-secondary" href="/reports">
          Back to reports
        </Link>
      </section>
    </>
  );
}
