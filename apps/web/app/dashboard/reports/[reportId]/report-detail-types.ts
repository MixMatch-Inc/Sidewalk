// Issue #141 – Normalize web report-detail rendering to current backend fields

export type ReportStatus = 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';
export type AnchorStatus = 'QUEUED' | 'ANCHORED' | 'FAILED';
export type IntegrityFlag = 'CLEAN' | 'SUSPICIOUS' | 'TAMPERED';

export type HistoryEntry = {
  type: string;
  status: ReportStatus;
  note: string | null;
  createdAt: string;
};

export type MediaItem = {
  fileId: string;
  mimeType: string;
};

export type ReportDetail = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: ReportStatus;
  anchor_status: AnchorStatus;
  integrity_flag: IntegrityFlag;
  exif_verified: boolean;
  exif_distance_meters: number | null;
  stellar_tx_hash: string | null;
  snapshot_hash: string | null;
  media: MediaItem[];
  history: HistoryEntry[];
};

const STATUS_LABELS: Record<ReportStatus, string> = {
  PENDING: 'Pending review',
  UNDER_REVIEW: 'Under review',
  RESOLVED: 'Resolved',
  REJECTED: 'Rejected',
};

const ANCHOR_LABELS: Record<AnchorStatus, string> = {
  QUEUED: 'Queued',
  ANCHORED: 'Anchored on Stellar',
  FAILED: 'Anchor failed',
};

const INTEGRITY_LABELS: Record<IntegrityFlag, string> = {
  CLEAN: 'Clean',
  SUSPICIOUS: 'Suspicious',
  TAMPERED: 'Tampered',
};

export const labelStatus = (s: ReportStatus) => STATUS_LABELS[s] ?? s;
export const labelAnchor = (s: AnchorStatus) => ANCHOR_LABELS[s] ?? s;
export const labelIntegrity = (s: IntegrityFlag) => INTEGRITY_LABELS[s] ?? s;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
