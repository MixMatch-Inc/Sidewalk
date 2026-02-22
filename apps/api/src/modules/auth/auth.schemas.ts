import { z } from 'zod';

const trimmedRequired = (label: string) =>
  z
    .string({
      required_error: `${label} is required`,
      invalid_type_error: `${label} must be a string`,
    })
    .trim()
    .min(1, `${label} is required`);

export const refreshTokenBodySchema = z.object({
  deviceId: trimmedRequired('deviceId'),
  refreshToken: z.string().trim().min(1).optional(),
  clientType: z.enum(['web', 'mobile']).default('web'),
});

export type RefreshTokenDTO = z.infer<typeof refreshTokenBodySchema>;

export const requestOtpBodySchema = z.object({
  email: z.string().trim().email('email must be valid'),
});

export const verifyOtpBodySchema = z.object({
  email: z.string().trim().email('email must be valid'),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'code must be a 6-digit numeric string'),
  deviceId: trimmedRequired('deviceId'),
  clientType: z.enum(['web', 'mobile']).default('web'),
  role: z.enum(['CITIZEN', 'AGENCY_ADMIN']).optional(),
  district: z.string().trim().min(1).optional(),
});

export type RequestOtpDTO = z.infer<typeof requestOtpBodySchema>;
export type VerifyOtpDTO = z.infer<typeof verifyOtpBodySchema>;
