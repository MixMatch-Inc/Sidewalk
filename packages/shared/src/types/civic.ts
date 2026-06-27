import type { ReportStatus, Visibility, ModerationOutcome } from "./enums.js";

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

export interface UserSummary {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt: string;
  reportCount?: number;
}

export interface ProfileUpdate {
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
}

export interface StatusDetail {
  current: ReportStatus;
  previous?: ReportStatus;
  reason?: string;
  changedBy?: string;
  changedAt: string;
}

export interface ReportDraft {
  id: string;
  authorId: string;
  title: string;
  description: string;
  visibility: Visibility;
  location?: string;
  mediaUrls: string[];
  status: Extract<ReportStatus, "draft">;
  createdAt: string;
  updatedAt: string;
}

export interface ModerationRecord {
  id: string;
  reportId: string;
  moderatorId: string;
  outcome: ModerationOutcome;
  reason?: string;
  createdAt: string;
}
