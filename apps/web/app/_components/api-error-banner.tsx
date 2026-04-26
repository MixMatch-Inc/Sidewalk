'use client';

import type { ApiErrorState } from '../lib/use-api-error';

const labels: Record<Exclude<ApiErrorState['kind'], 'none'>, string> = {
  auth: 'Session expired',
  forbidden: 'Access denied',
  validation: 'Invalid input',
  server: 'Server error',
};

interface Props {
  error: ApiErrorState;
  onDismiss?: () => void;
}

export function ApiErrorBanner({ error, onDismiss }: Props) {
  if (error.kind === 'none') return null;

  return (
    <div role="alert" className="status-note error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span>
        <strong>{labels[error.kind]}:</strong> {error.message}
      </span>
      {onDismiss ? (
        <button type="button" onClick={onDismiss} aria-label="Dismiss error" style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
          ×
        </button>
      ) : null}
    </div>
  );
}
