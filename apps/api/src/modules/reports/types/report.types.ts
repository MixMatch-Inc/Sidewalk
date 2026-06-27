import type {
  Report,
  ReportSubmission,
  ReportSummary,
  ModerationRecord,
  ReportFilter,
  ReportDraft,
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

export interface DraftCreateRequest {
  title: string;
  description: string;
  visibility: string;
  location?: string;
  mediaUrls?: string[];
}

export interface DraftCreateResponse {
  draft: ReportDraft;
}

export interface ModerationActionRequest {
  outcome: "approved" | "rejected" | "flagged" | "escalated";
  reason?: string;
}

export type { Report, ReportSummary, ReportFilter, ModerationRecord, ReportDraft };
