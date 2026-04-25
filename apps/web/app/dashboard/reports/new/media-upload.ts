// Issue #144 – Media draft and upload flow for web report submission
'use client';

import { useState } from 'react';
import { getApiBaseUrl } from '../../../lib/api';
import { getAccessToken } from '../../../lib/auth-storage';

type DraftResponse = { fileId: string; uploadUrl: string };
type UploadedFile = { fileId: string; name: string };

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

async function createDraft(file: File): Promise<DraftResponse> {
  const base = getApiBaseUrl();
  const token = getAccessToken();
  const res = await fetch(`${base}/api/media/draft`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ filename: file.name, mimeType: file.type, size: file.size }),
  });
  if (!res.ok) throw new Error('Failed to create media draft');
  return res.json() as Promise<DraftResponse>;
}

async function uploadToUrl(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
  if (!res.ok) throw new Error('Upload failed');
}

export function useMediaUpload() {
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    if (!ACCEPTED.includes(file.type)) {
      setError('Only JPEG, PNG, and WebP images are supported.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const { fileId, uploadUrl } = await createDraft(file);
      await uploadToUrl(uploadUrl, file);
      setUploads((prev) => [...prev, { fileId, name: file.name }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const remove = (fileId: string) => setUploads((prev) => prev.filter((u) => u.fileId !== fileId));

  return { uploads, uploading, error, upload, remove };
}
