"use client";

import { useRef, useState } from "react";
import { authFetch } from "../../../../lib/auth-fetch";

const TRANSITIONS = ["acknowledged", "in_progress", "resolved", "rejected"] as const;
type Transition = (typeof TRANSITIONS)[number];

interface Props {
  reportId: string;
  onSuccess?: () => void;
}

export function StatusUpdateComposer({ reportId, onSuccess }: Props) {
  const [status, setStatus] = useState<Transition>("acknowledged");
  const [note, setNote] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadEvidence(file: File) {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await authFetch(`/api/reports/${reportId}/evidence`, { method: "POST", body: form });
    const data = await res.json();
    setEvidenceUrl(data.url ?? null);
    setUploading(false);
  }

  async function submit() {
    if (!note.trim()) { setError("Note is required"); return; }
    setError(null);
    await authFetch(`/api/reports/${reportId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note, evidenceUrl }),
    });
    onSuccess?.();
  }

  return (
    <div className="space-y-3 border rounded-xl p-4">
      <h2 className="font-semibold">Update Status</h2>
      <select value={status} onChange={(e) => setStatus(e.target.value as Transition)} className="border rounded px-2 py-1 w-full">
        {TRANSITIONS.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…" className="border rounded px-2 py-1 w-full h-20 resize-none" />
      <input ref={fileRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && uploadEvidence(e.target.files[0])} />
      <button onClick={() => fileRef.current?.click()} className="text-sm underline">{uploading ? "Uploading…" : evidenceUrl ? "Evidence attached ✓" : "Attach evidence"}</button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button onClick={submit} className="bg-blue-600 text-white px-4 py-2 rounded w-full">Submit Update</button>
    </div>
  );
}
