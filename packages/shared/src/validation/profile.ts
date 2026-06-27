import { z } from "zod";

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Display name is required.")
  .max(100, "Display name must be at most 100 characters.");

export const avatarUrlSchema = z.string().url("Invalid avatar URL.").optional();

export const bioSchema = z
  .string()
  .max(500, "Bio must be at most 500 characters.")
  .optional();

export const profileUpdateSchema = z.object({
  displayName: displayNameSchema.optional(),
  avatarUrl: avatarUrlSchema,
  bio: bioSchema,
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
