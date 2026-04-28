'use client';

import { useEffect, useRef, useState } from 'react';
import { authenticatedJsonFetch } from '../../../lib/auth-fetch';

type Comment = {
  id: string;
  body: string;
  author_name: string;
  visibility: 'PUBLIC' | 'INTERNAL';
  created_at: string;
};

type Props = { reportId: string };

export function CommentThread({ reportId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = () =>
    authenticatedJsonFetch<{ data: Comment[] }>(`/api/reports/${reportId}/comments`)
      .then((res) => setComments(res.data.filter((c) => c.visibility === 'PUBLIC')))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load comments'));

  useEffect(() => { void load(); }, [reportId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await authenticatedJsonFetch(`/api/reports/${reportId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: body.trim(), visibility: 'PUBLIC' }),
      });
      setBody('');
      await load();
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="comment-thread">
      <h3>Comments</h3>
      {error && <p className="status-note error">{error}</p>}
      <ul className="comment-list">
        {comments.map((c) => (
          <li key={c.id} className="comment-item">
            <p className="eyebrow">{c.author_name} · {new Date(c.created_at).toLocaleString()}</p>
            <p>{c.body}</p>
          </li>
        ))}
      </ul>
      <div ref={bottomRef} />
      <form onSubmit={(e) => void submit(e)} className="comment-form">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a public comment…"
          rows={3}
          required
        />
        <button className="button button-primary" type="submit" disabled={submitting}>
          {submitting ? 'Posting…' : 'Post'}
        </button>
      </form>
    </section>
  );
}
