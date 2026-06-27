import { z } from "zod";
import { ReportStatus, Visibility, ModerationOutcome } from "../types/enums.js";

export const reportSubmissionSchema = z.object({
  title: z.string().min(1, "Title is required.").max(200),
  description: z.string().min(1, "Description is required.").max(5000),
  visibility: z.enum([
    Visibility.PUBLIC,
    Visibility.PRIVATE,
    Visibility.MODERATORS_ONLY,
  ]),
  location: z.string().optional(),
  mediaUrls: z.array(z.string().url()).max(10).optional(),
});

export const reportStatusSchema = z.enum([
  ReportStatus.DRAFT,
  ReportStatus.SUBMITTED,
  ReportStatus.UNDER_REVIEW,
  ReportStatus.RESOLVED,
  ReportStatus.CLOSED,
]);

export const moderationSchema = z.object({
  outcome: z.enum([
    ModerationOutcome.APPROVED,
    ModerationOutcome.REJECTED,
    ModerationOutcome.FLAGGED,
    ModerationOutcome.ESCALATED,
  ]),
  reason: z.string().max(1000).optional(),
});

export type ReportSubmissionInput = z.infer<typeof reportSubmissionSchema>;
export type ModerationInput = z.infer<typeof moderationSchema>;
