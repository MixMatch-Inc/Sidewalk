/** Normalized report-list response contract with stable pagination metadata (issue #158). */

export interface ReportListItemDTO {
  id: string;
  title: string;
  category: string;
  status: string;
  district: string | null;
  location: { lng: number; lat: number };
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ReportListResponseDTO {
  data: ReportListItemDTO[];
  pagination: PaginationMeta;
}

export function toReportListItemDTO(doc: Record<string, any>): ReportListItemDTO {
  return {
    id: String(doc._id),
    title: doc.title,
    category: doc.category,
    status: doc.status,
    district: doc.district ?? null,
    location: { lng: doc.location.coordinates[0], lat: doc.location.coordinates[1] },
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt),
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : String(doc.updatedAt),
  };
}

export function buildReportListResponse(
  docs: Record<string, any>[],
  total: number,
  page: number,
  pageSize: number,
): ReportListResponseDTO {
  return {
    data: docs.map(toReportListItemDTO),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
