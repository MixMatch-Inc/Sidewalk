'use client';

import { FormEvent, useEffect, useState } from 'react';
import { authenticatedJsonFetch } from '../../lib/auth-fetch';

type QueueReport = {
  id: string;
  title: string;
  category: string;
  status: string;
  anchor_status: string;
  integrity_flag: string;
};

type QueueResponse = {
  data: QueueReport[];
};

const nextStatuses = ['ACKNOWLEDGED', 'RESOLVED', 'REJECTED', 'ESCALATED'];

export function AdminQueue() {
  const [reports, setReports] = useState<QueueReport[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string>('');
  const [status, setStatus] = useState('ACKNOWLEDGED');
  const [stellarTxHash, setStellarTxHash] = useState('');
  const [evidence, setEvidence] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadQueue = async () => {
      try {
        const payload = await authenticatedJsonFetch<QueueResponse>('/api/reports?page=1&pageSize=10');
        if (!cancelled) {
          setReports(payload.data);
          setSelectedReportId(payload.data[0]?.id ?? '');
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load moderation queue');
        }
      }
    };

    void loadQueue();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    try {
      await authenticatedJsonFetch('/api/reports/status', {
        method: 'POST',
        body: JSON.stringify({
          originalTxHash: stellarTxHash,
          status,
          evidence: evidence || undefined,
        }),
      });
      setMessage('Status update anchored successfully.');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to submit status update');
    }
  };

  return (
    <>
      <section className="surface-grid report-grid">
        {reports.map((report) => (
          <article className="surface-card" key={report.id}>
            <p className="eyebrow">{report.category}</p>
            <h2>{report.title}</h2>
            <p className="helper-copy">
              {report.status} · {report.anchor_status}
            </p>
            {report.integrity_flag !== 'NORMAL' ? (
              <p className="status-note error">Integrity flag: {report.integrity_flag}</p>
            ) : null}
            <button
              className="button button-secondary"
              type="button"
              onClick={() => setSelectedReportId(report.id)}
            >
              Moderate
            </button>
          </article>
        ))}
      </section>

      <section className="auth-card">
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>Selected report</span>
            <input value={selectedReportId} onChange={(event) => setSelectedReportId(event.target.value)} />
          </label>
          <label className="field">
            <span>Original Stellar transaction hash</span>
            <input value={stellarTxHash} onChange={(event) => setStellarTxHash(event.target.value)} required />
          </label>
          <label className="field">
            <span>Next status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              {nextStatuses.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Evidence note</span>
            <textarea className="input-area" rows={4} value={evidence} onChange={(event) => setEvidence(event.target.value)} />
          </label>
          <button className="button button-primary" type="submit">
            Anchor status update
          </button>
        </form>

        {message ? <p className="status-note success">{message}</p> : null}
        {error ? <p className="status-note error">{error}</p> : null}
      </section>
    </>
  );
}
