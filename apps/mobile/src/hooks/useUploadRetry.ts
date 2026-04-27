/** Background-friendly upload retry handling (issue #211) */

import { useState, useCallback } from "react";

type UploadStatus = "pending" | "uploading" | "done" | "failed";

interface UploadEntry {
  id: string;
  uri: string;
  status: UploadStatus;
  error?: string;
}

type UploadFn = (uri: string) => Promise<void>;

export function useUploadRetry(uploadFn: UploadFn) {
  const [queue, setQueue] = useState<UploadEntry[]>([]);

  const enqueue = useCallback((id: string, uri: string) => {
    setQueue((prev) => {
      if (prev.some((e) => e.id === id)) return prev;
      return [...prev, { id, uri, status: "pending" }];
    });
  }, []);

  const attempt = useCallback(
    async (id: string) => {
      const entry = queue.find((e) => e.id === id);
      if (!entry || entry.status === "done" || entry.status === "uploading") return;

      setQueue((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: "uploading", error: undefined } : e))
      );

      try {
        await uploadFn(entry.uri);
        setQueue((prev) =>
          prev.map((e) => (e.id === id ? { ...e, status: "done" } : e))
        );
      } catch (err) {
        const error = err instanceof Error ? err.message : "Upload failed";
        setQueue((prev) =>
          prev.map((e) => (e.id === id ? { ...e, status: "failed", error } : e))
        );
      }
    },
    [queue, uploadFn]
  );

  const retry = useCallback((id: string) => attempt(id), [attempt]);

  const failed = queue.filter((e) => e.status === "failed");
  const pending = queue.filter((e) => e.status === "pending");

  return { queue, enqueue, retry, attempt, failed, pending };
}
