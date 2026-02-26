import { z } from 'zod';

export const secureMediaParamsSchema = z.object({
  fileId: z
    .string({
      required_error: 'fileId is required',
      invalid_type_error: 'fileId must be a string',
    })
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, 'fileId must be a valid id'),
});

export type SecureMediaParamsDTO = z.infer<typeof secureMediaParamsSchema>;
