import { z } from "zod";

export const reportSubmissionSchema = z.object({
  title: z.string().min(1, "Title is required.").max(200),
  description: z.string().min(1, "Description is required.").max(5000),
  visibility: z.enum(["public", "private", "moderators_only"]),
  location: z.string().optional(),
  mediaUrls: z.array(z.string().url()).max(10).optional(),
});

export const reportStatusSchema = z.enum([
  "draft",
  "submitted",
  "under_review",
  "resolved",
  "closed",
]);

export const moderationSchema = z.object({
  outcome: z.enum(["approved", "rejected", "flagged", "escalated"]),
  reason: z.string().max(1000).optional(),
});

export type ReportSubmissionInput = z.infer<typeof reportSubmissionSchema>;
export type ModerationInput = z.infer<typeof moderationSchema>;
