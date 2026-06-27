export const ReportStatus = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  UNDER_REVIEW: "under_review",
  RESOLVED: "resolved",
  CLOSED: "closed",
} as const;

export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

export const Visibility = {
  PUBLIC: "public",
  PRIVATE: "private",
  MODERATORS_ONLY: "moderators_only",
} as const;

export type Visibility = (typeof Visibility)[keyof typeof Visibility];

export const ModerationOutcome = {
  APPROVED: "approved",
  REJECTED: "rejected",
  FLAGGED: "flagged",
  ESCALATED: "escalated",
} as const;

export type ModerationOutcome = (typeof ModerationOutcome)[keyof typeof ModerationOutcome];

export const ModerationAction = {
  APPROVE: "approve",
  REJECT: "reject",
  FLAG: "flag",
  ESCALATE: "escalate",
  DISMISS: "dismiss",
} as const;

export type ModerationAction = (typeof ModerationAction)[keyof typeof ModerationAction];
