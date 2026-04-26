/** Canonical authenticated report-detail response contract (issue #157). */

export interface AnchorMeta {
  status: 'ANCHOR_QUEUED' | 'ANCHOR_SUCCESS' | 'ANCHOR_FAILED';
  txHash: string | null;
  needsAttention: boolean;
}

export interface IntegrityData {
  dataHash: string;
  snapshotHash: string | null;
  exifVerified: boolean;
  exifDistanceMeters: number | null;
  flag: 'NORMAL' | 'SUSPICIOUS';
}

export interface HistoryItem {
  id: string;
  status: string;
  note: string;
  visibility: 'public' | 'internal';
  createdAt: string;
}

export interface MediaRef {
  url: string;
}

export interface ReportDetailDTO {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  district: string | null;
  location: { lng: number; lat: number };
  anchor: AnchorMeta;
  integrity: IntegrityData;
  media: MediaRef[];
  history: HistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export function toReportDetailDTO(doc: Record<string, any>, history: HistoryItem[]): ReportDetailDTO {
  return {
    id: String(doc._id),
    title: doc.title,
    description: doc.description,
    category: doc.category,
    status: doc.status,
    district: doc.district ?? null,
    location: { lng: doc.location.coordinates[0], lat: doc.location.coordinates[1] },
    anchor: {
      status: doc.anchor_status,
      txHash: doc.stellar_tx_hash,
      needsAttention: doc.anchor_needs_attention,
    },
    integrity: {
      dataHash: doc.data_hash,
      snapshotHash: doc.snapshot_hash,
      exifVerified: doc.exif_verified,
      exifDistanceMeters: doc.exif_distance_meters,
      flag: doc.integrity_flag,
    },
    media: (doc.media_urls as string[]).map((url) => ({ url })),
    history,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt),
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : String(doc.updatedAt),
  };
}
