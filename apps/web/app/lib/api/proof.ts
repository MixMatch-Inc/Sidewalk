export type ProofStatus = 'verified' | 'pending' | 'failed' | 'not_found';

export interface ProofRecord {
  reportId: string;
  snapshotHash: string;
  txHash: string | null;
  chain: string;
  blockNumber: number | null;
  timestamp: string;
  status: ProofStatus;
  failReason?: string;
  explorerBaseUrl?: string;
  category?: string;
  district?: string;
}

const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export async function fetchProof(idOrHash: string): Promise<ProofRecord | null> {
  const isHash = idOrHash.startsWith('0x');
  const endpoint = isHash
    ? `/api/proofs/tx/${idOrHash}`
    : `/api/proofs/${idOrHash}`;

  const res = await fetch(`${BASE}${endpoint}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Proof fetch failed: ${res.status}`);
  return res.json();
}