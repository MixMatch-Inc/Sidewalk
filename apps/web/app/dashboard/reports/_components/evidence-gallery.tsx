'use client';

import { useEffect, useState } from 'react';
import { authenticatedJsonFetch } from '../../../lib/auth-fetch';

type EvidenceItem = {
  id: string;
  url: string;
  expires_at: string;
  status_update_id: string;
  mime_type: string;
};

type Props = { reportId: string };

export function EvidenceGallery({ reportId }: Props) {
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    return authenticatedJsonFetch<{ data: EvidenceItem[] }>(`/api/reports/${reportId}/evidence`)
      .then((res) => setItems(res.data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load evidence'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { void load(); }, [reportId]);

  const refreshExpired = async (item: EvidenceItem) => {
    if (new Date(item.expires_at) > new Date()) return item.url;
    const refreshed = await authenticatedJsonFetch<{ url: string }>(
      `/api/reports/${reportId}/evidence/${item.id}/refresh`,
      { method: 'POST' },
    );
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, url: refreshed.url } : i)));
    return refreshed.url;
  };

  const grouped = items.reduce<Record<string, EvidenceItem[]>>((acc, item) => {
    (acc[item.status_update_id] ??= []).push(item);
    return acc;
  }, {});

  if (loading) return <p className="helper-copy">Loading evidence…</p>;
  if (error) return <p className="status-note error">{error}</p>;
  if (items.length === 0) return <p className="helper-copy">No evidence attached.</p>;

  return (
    <section className="evidence-gallery">
      <h3>Evidence</h3>
      {Object.entries(grouped).map(([updateId, group]) => (
        <div key={updateId} className="evidence-group">
          <p className="eyebrow">Status update {updateId.slice(-6)}</p>
          <div className="evidence-grid">
            {group.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                onClick={async (e) => {
                  e.preventDefault();
                  const url = await refreshExpired(item);
                  window.open(url, '_blank');
                }}
              >
                {item.mime_type.startsWith('image/') ? (
                  <img src={item.url} alt="evidence" className="evidence-thumb" />
                ) : (
                  <span className="evidence-file">{item.mime_type}</span>
                )}
              </a>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
