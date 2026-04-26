// Issue #142 – Secure media previews for authenticated report detail pages
'use client';

import { useCallback, useEffect, useState } from 'react';
import { authenticatedJsonFetch } from '../../../lib/auth-fetch';

type SecureUrlResponse = { url: string; expiresAt: number };

type PreviewState = {
  url: string | null;
  loading: boolean;
  error: string | null;
};

export function useSecureMediaUrl(fileId: string | null): PreviewState & { refresh: () => void } {
  const [state, setState] = useState<PreviewState>({ url: null, loading: false, error: null });

  const fetch = useCallback(async () => {
    if (!fileId) return;
    setState({ url: null, loading: true, error: null });
    try {
      const { url, expiresAt } = await authenticatedJsonFetch<SecureUrlResponse>(
        `/api/media/secure/${fileId}`,
      );
      setState({ url, loading: false, error: null });

      // Auto-refresh 30 s before expiry
      const ttl = expiresAt - Date.now() - 30_000;
      if (ttl > 0) {
        const timer = setTimeout(() => void fetch(), ttl);
        return () => clearTimeout(timer);
      }
    } catch (err) {
      setState({ url: null, loading: false, error: err instanceof Error ? err.message : 'Failed to load preview' });
    }
  }, [fileId]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { ...state, refresh: () => void fetch() };
}

type Props = { fileId: string; alt?: string };

export function SecureMediaPreview({ fileId, alt = 'Report media' }: Readonly<Props>) {
  const { url, loading, error, refresh } = useSecureMediaUrl(fileId);

  if (loading) return <p className="helper-copy">Loading preview…</p>;
  if (error) return (
    <p className="status-note error">
      {error} <button className="button button-secondary" onClick={refresh}>Retry</button>
    </p>
  );
  if (!url) return null;

  return <img src={url} alt={alt} className="media-preview" />;
}
