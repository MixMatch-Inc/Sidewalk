import type {
  Report,
  ReportSubmission,
  ReportSummary,
  ModerationRecord,
  ReportFilter,
} from "@sidewalk/shared";

export type ReportCreateRequest = ReportSubmission;

export interface ReportCreateResponse {
  report: Report;
}

export interface ReportListResponse {
  reports: ReportSummary[];
  total: number;
  nextCursor?: string;
}

export interface ReportDetailResponse {
  report: Report;
}

export interface ModerationActionRequest {
  outcome: "approved" | "rejected" | "flagged" | "escalated";
  reason?: string;
}

export type { Report, ReportSummary, ReportFilter, ModerationRecord };
