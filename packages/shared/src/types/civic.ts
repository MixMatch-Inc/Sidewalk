export type ReportStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "resolved"
  | "closed";

export type Visibility =
  | "public"
  | "private"
  | "moderators_only";

export type ModerationOutcome =
  | "approved"
  | "rejected"
  | "flagged"
  | "escalated";

export interface ReportProfile {
  id: string;
  displayName: string;
  avatarUrl?: string;
}

export interface ReportSubmission {
  title: string;
  description: string;
  visibility: Visibility;
  location?: string;
  mediaUrls?: string[];
}

export interface Report {
  id: string;
  authorId: string;
  title: string;
  description: string;
  status: ReportStatus;
  visibility: Visibility;
  location?: string;
  mediaUrls: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReportSummary {
  id: string;
  title: string;
  status: ReportStatus;
  createdAt: string;
  author: ReportProfile;
}

export interface ModerationRecord {
  id: string;
  reportId: string;
  moderatorId: string;
  outcome: ModerationOutcome;
  reason?: string;
  createdAt: string;
}
