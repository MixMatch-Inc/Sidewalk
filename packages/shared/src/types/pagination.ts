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

export interface UserFilter {
  search?: string;
  role?: string;
  createdAfter?: string;
  createdBefore?: string;
}

export interface ModerationFilter {
  outcome?: string;
  moderatorId?: string;
  reportId?: string;
  createdAfter?: string;
  createdBefore?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}
