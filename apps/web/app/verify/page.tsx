'use client';
import { useState } from 'react';
import { fetchProof, ProofRecord } from '@/lib/api/proof';

type State = 'idle' | 'loading' | 'found' | 'not_found' | 'error';

export default function VerifyPage() {
  const [query, setQuery] = useState('');
  const [state, setState] = useState<State>('idle');
  const [proof, setProof] = useState<ProofRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setState('loading');
    try {
      const result = await fetchProof(q);
      if (!result) {
        setState('not_found');
      } else {
        setProof(result);
        setState('found');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
      setState('error');
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-medium mb-1">Proof verification</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Enter a report ID or transaction hash to verify its proof. No sign-in required.
      </p>

      {/* Lookup form */}
      <form onSubmit={handleVerify} className="flex gap-2 mb-8">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="RPT-2024-001839 or 0x4a3f…"
          className="flex-1 input"
          autoComplete="off"
          spellCheck={false}
        />
        <button type="submit" className="btn btn-primary" disabled={state === 'loading'}>
          {state === 'loading' ? 'Checking…' : 'Verify'}
        </button>
      </form>

      {/* States */}
      {state === 'not_found' && <NotFound query={query} />}
      {state === 'error' && <ErrorState message={errorMsg} />}
      {state === 'found' && proof && <ProofResult proof={proof} />}
    </main>
  );
}

/* ---- Sub-components ---- */

function NotFound({ query }: { query: string }) {
  return (
    <div className="card border-destructive">
      <p className="font-medium mb-1">Not found</p>
      <p className="text-sm text-muted-foreground">
        No proof record matches <code className="font-mono text-xs">{query}</code>.
        Check the ID in your confirmation message or try the full transaction hash.
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="card border-destructive">
      <p className="font-medium mb-1">Verification error</p>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function ProofResult({ proof }: { proof: ProofRecord }) {
  const statusConfig = {
    verified: { label: 'Verified', className: 'badge-success' },
    pending:  { label: 'Pending',  className: 'badge-warning' },
    failed:   { label: 'Failed',   className: 'badge-destructive' },
    not_found:{ label: 'Not found',className: 'badge-secondary' },
  } as const;

  const sc = statusConfig[proof.status];

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-base">{proof.reportId}</p>
          <p className="text-sm text-muted-foreground">
            {proof.category} · {proof.district} · {proof.timestamp}
          </p>
        </div>
        <span className={`badge ${sc.className}`}>{sc.label}</span>
      </div>

      {/* Pending explanation */}
      {proof.status === 'pending' && (
        <div className="rounded-md bg-warning/10 border border-warning/30 p-3 text-sm text-warning-foreground">
          This proof is being anchored to the chain. Anchoring typically completes within
          5–15 minutes of submission. Refresh the page to check for updates.
        </div>
      )}

      {/* Failed explanation */}
      {proof.status === 'failed' && proof.failReason && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
          {proof.failReason}
        </div>
      )}

      {/* Proof steps */}
      <div className="divide-y">
        <ProofStep
          num={1}
          done
          title="Snapshot hash recorded"
          detail={proof.snapshotHash}
          note="SHA-256 of report data at submission time."
        />
        <ProofStep
          num={2}
          done={!!proof.txHash}
          pending={!proof.txHash && proof.status === 'pending'}
          title="Transaction submitted"
          detail={proof.txHash ?? 'Awaiting confirmation'}
          note={proof.blockNumber ? `Block ${proof.blockNumber}` : undefined}
        />
        <ProofStep
          num={3}
          done={proof.status === 'verified'}
          pending={proof.status === 'pending'}
          failed={proof.status === 'failed'}
          title="Chain proof anchored"
          detail={
            proof.status === 'verified'
              ? `Confirmed on ${proof.chain}`
              : proof.status === 'pending'
              ? 'Waiting for block confirmation'
              : 'Anchoring failed'
          }
        />
        <ProofStep
          num={4}
          done={proof.status === 'verified'}
          title="Verification result"
          detail={
            proof.status === 'verified'
              ? 'Hash matches on-chain record. Report data is intact.'
              : proof.status === 'pending'
              ? 'Pending chain confirmation'
              : 'Verification could not be completed.'
          }
        />
      </div>

      {/* Explorer link */}
      {proof.txHash && proof.explorerBaseUrl && (
        <a
          href={`${proof.explorerBaseUrl}/tx/${proof.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          View on {proof.chain} explorer →
        </a>
      )}
    </div>
  );
}

function ProofStep({
  num, title, detail, note,
  done = false, pending = false, failed = false,
}: {
  num: number; title: string; detail: string; note?: string;
  done?: boolean; pending?: boolean; failed?: boolean;
}) {
  const icon = done ? '✓' : failed ? '✕' : pending ? '⋯' : String(num);
  const cls = done
    ? 'bg-success/15 text-success'
    : failed
    ? 'bg-destructive/15 text-destructive'
    : pending
    ? 'bg-warning/15 text-warning'
    : 'bg-muted text-muted-foreground';

  return (
    <div className="flex gap-3 py-3">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${cls}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="font-mono text-xs text-muted-foreground break-all mt-0.5">{detail}</p>
        {note && <p className="text-xs text-muted-foreground mt-0.5">{note}</p>}
      </div>
    </div>
  );
}