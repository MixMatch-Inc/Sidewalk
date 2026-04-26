'use client';

import { FormEvent, useState } from 'react';
import { authenticatedJsonFetch } from '../../lib/auth-fetch';

type ReportStatus = 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED' | 'REJECTED' | 'ESCALATED';

const allowedTransitions: Record<ReportStatus, ReportStatus[]> = {
  PENDING: ['ACKNOWLEDGED', 'REJECTED'],
  ACKNOWLEDGED: ['RESOLVED', 'ESCALATED', 'REJECTED'],
  ESCALATED: ['RESOLVED', 'REJECTED'],
  RESOLVED: [],
  REJECTED: [],
};

interface Props {
  reportId: string;
  reportTitle: string;
  anchorTxHash: string;
  currentStatus: ReportStatus;
  onSuccess: () => void;
}

export function StatusUpdateComposer({ reportId, reportTitle, anchorTxHash, currentStatus, onSuccess }: Props) {
  const allowed = allowedTransitions[currentStatus];
  const [nextStatus, setNextStatus] = useState<ReportStatus>(allowed[0] ?? currentStatus);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (allowed.length === 0) {
    return <p className="helper-copy">No further transitions available for <strong>{currentStatus}</strong>.</p>;
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!allowed.includes(nextStatus)) {
      setError(`Cannot transition from ${currentStatus} to ${nextStatus}.`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await authenticatedJsonFetch(`/api/reports/${reportId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: nextStatus, evidence: note || undefined, originalTxHash: anchorTxHash }),
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <p className="helper-copy">Updating: <strong>{reportTitle}</strong> ({currentStatus})</p>
      <label className="field">
        <span>Next status</span>
        <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value as ReportStatus)}>
          {allowed.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label className="field">
        <span>Evidence note (optional)</span>
        <textarea className="input-area" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <button className="button button-primary" type="submit" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit update'}
      </button>
      {error && <p className="status-note error">{error}</p>}
    </form>
  );
}
