'use client';

import { FormEvent, useEffect, useState } from 'react';
import { authenticatedJsonFetch } from '../../lib/auth-fetch';

type QueueReport = {
  id: string;
  title: string;
  category: string;
  status: string;
  anchor_status: string;
  stellar_tx_hash: string;
  integrity_flag: string;
};

type QueueResponse = { data: QueueReport[] };

const nextStatuses = ['ACKNOWLEDGED', 'RESOLVED', 'REJECTED', 'ESCALATED'];

export function AdminQueue() {
  const [reports, setReports] = useState<QueueReport[]>([]);
  const [selected, setSelected] = useState<QueueReport | null>(null);
  const [status, setStatus] = useState('ACKNOWLEDGED');
  const [evidence, setEvidence] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    authenticatedJsonFetch<QueueResponse>('/api/reports?page=1&pageSize=10')
      .then((payload) => {
        if (!cancelled) {
          setReports(payload.data);
          setSelected(payload.data[0] ?? null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load queue');
      });
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selected) return;
    setError(null);
    setMessage(null);
    try {
      await authenticatedJsonFetch(`/api/reports/${selected.id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status, evidence: evidence || undefined }),
      });
      setMessage(`Report "${selected.title}" updated to ${status}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit update');
    }
  };

  return (
    <>
      <section className="surface-grid report-grid">
        {reports.map((report) => (
          <article className={`surface-card${selected?.id === report.id ? ' selected' : ''}`} key={report.id}>
            <p className="eyebrow">{report.category}</p>
            <h2>{report.title}</h2>
            <p className="helper-copy">{report.status} · {report.anchor_status}</p>
            {report.integrity_flag !== 'NORMAL' && (
              <p className="status-note error">Flag: {report.integrity_flag}</p>
            )}
            <button className="button button-secondary" type="button" onClick={() => setSelected(report)}>
              Moderate
            </button>
          </article>
        ))}
      </section>

      {selected && (
        <section className="auth-card">
          <p className="helper-copy">Moderating: <strong>{selected.title}</strong></p>
          <p className="helper-copy">Anchor tx: {selected.stellar_tx_hash || '—'}</p>
          <form className="form-grid" onSubmit={handleSubmit}>
            <label className="field">
              <span>Next status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                {nextStatuses.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Evidence note</span>
              <textarea className="input-area" rows={3} value={evidence} onChange={(e) => setEvidence(e.target.value)} />
            </label>
            <button className="button button-primary" type="submit">Anchor status update</button>
          </form>
          {message && <p className="status-note success">{message}</p>}
          {error && <p className="status-note error">{error}</p>}
        </section>
      )}
    </>
  );
}
