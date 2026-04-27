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
  assignment?: {
    id: string;
    assigneeName: string;
    assignedAt: string;
    note?: string;
  };
};

type Assignee = {
  id: string;
  name: string;
  email: string;
  role: string;
  district?: string;
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
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('');
  const [assignmentNote, setAssignmentNote] = useState<string>('');
  const [isLoadingAssignees, setIsLoadingAssignees] = useState(false);
  const [assignmentMessage, setAssignmentMessage] = useState<string | null>(null);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

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

    const loadAssignees = async () => {
      setIsLoadingAssignees(true);
      try {
        const payload = await authenticatedJsonFetch<{ data: Assignee[] }>('/api/reports/assignments/assignees');
        if (!cancelled) {
          setAssignees(payload.data);
        }
      } catch (loadError) {
        if (!cancelled) {
          console.error('Failed to load assignees:', loadError);
        }
      } finally {
        setIsLoadingAssignees(false);
      }
    };

    void loadQueue();
    void loadAssignees();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleAssignReport = async () => {
    if (!selectedReportId || !selectedAssigneeId) {
      setAssignmentError('Please select both a report and an assignee');
      return;
    }

    setAssignmentError(null);
    setAssignmentMessage(null);

    try {
      await authenticatedJsonFetch('/api/reports/assignments/assign', {
        method: 'POST',
        body: JSON.stringify({
          reportId: selectedReportId,
          assigneeId: selectedAssigneeId,
          note: assignmentNote || undefined,
        }),
      });
      setAssignmentMessage('Report assigned successfully.');
      setAssignmentNote('');
      setSelectedAssigneeId('');
      // Refresh queue to show updated assignments
      const queuePayload = await authenticatedJsonFetch<QueueResponse>('/api/reports?page=1&pageSize=10');
      setReports(queuePayload.data);
    } catch (assignError) {
      setAssignmentError(assignError instanceof Error ? assignError.message : 'Unable to assign report');
    }
  };

  const handleReleaseAssignment = async () => {
    if (!selectedReportId) {
      setAssignmentError('Please select a report');
      return;
    }

    setAssignmentError(null);
    setAssignmentMessage(null);

    try {
      await authenticatedJsonFetch('/api/reports/assignments/release', {
        method: 'POST',
        body: JSON.stringify({
          reportId: selectedReportId,
        }),
      });
      setAssignmentMessage('Assignment released successfully.');
      // Refresh queue to show updated assignments
      const queuePayload = await authenticatedJsonFetch<QueueResponse>('/api/reports?page=1&pageSize=10');
      setReports(queuePayload.data);
    } catch (releaseError) {
      setAssignmentError(releaseError instanceof Error ? releaseError.message : 'Unable to release assignment');
    }
  };

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
            {report.assignment && (
              <p className="helper-copy assignment-info">
                Assigned to: <strong>{report.assignment.assigneeName}</strong> on {new Date(report.assignment.assignedAt).toLocaleDateString()}
                {report.assignment.note && <span> - "{report.assignment.note}"</span>}
              </p>
            )}
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
        <h2>Assign Report</h2>
        <form className="form-grid" onSubmit={(e) => { e.preventDefault(); handleAssignReport(); }}>
          <label className="field">
            <span>Assign to</span>
            <select 
              value={selectedAssigneeId} 
              onChange={(event) => setSelectedAssigneeId(event.target.value)}
              disabled={isLoadingAssignees}
            >
              <option value="">Select assignee...</option>
              {assignees.map((assignee) => (
                <option key={assignee.id} value={assignee.id}>
                  {assignee.name} ({assignee.email})
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Assignment note (optional)</span>
            <textarea 
              className="input-area" 
              rows={3} 
              value={assignmentNote} 
              onChange={(event) => setAssignmentNote(event.target.value)} 
              placeholder="Add context for this assignment..."
            />
          </label>
          <div className="button-row">
            <button className="button button-primary" type="submit" disabled={!selectedAssigneeId}>
              Assign Report
            </button>
            <button 
              className="button button-secondary" 
              type="button"
              onClick={handleReleaseAssignment}
              disabled={!selectedReportId}
            >
              Release Assignment
            </button>
          </div>
        </form>
        {assignmentMessage ? <p className="status-note success">{assignmentMessage}</p> : null}
        {assignmentError ? <p className="status-note error">{assignmentError}</p> : null}
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
