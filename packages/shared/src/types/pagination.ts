export interface PageRequest {
  cursor?: string;
  limit: number;
}

export interface PageResponse<T> {
  data: T[];
  nextCursor?: string;
  total: number;
}

export interface ReportFilter {
  status?: string;
  visibility?: string;
  authorId?: string;
  createdAfter?: string;
  createdBefore?: string;
}
