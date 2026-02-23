import { z } from 'zod';

const trimmed = (label: string) =>
  z
    .string({
      required_error: `${label} is required`,
      invalid_type_error: `${label} must be a string`,
    })
    .trim()
    .min(1, `${label} is required`);

export const createReportBodySchema = z.object({
  title: trimmed('title'),
  description: trimmed('description'),
  category: z.enum([
    'INFRASTRUCTURE',
    'SANITATION',
    'SAFETY',
    'LIGHTING',
    'TRANSPORT',
    'DRAINAGE',
    'UTILITIES',
    'TRAFFIC',
    'OTHER',
  ]),
  location: z.object({
    type: z.literal('Point'),
    coordinates: z
      .tuple([z.number(), z.number()])
      .refine(
        ([lng, lat]) =>
          Number.isFinite(lng) &&
          Number.isFinite(lat) &&
          lng >= -180 &&
          lng <= 180 &&
          lat >= -90 &&
          lat <= 90,
        'location.coordinates must be valid and ordered [longitude, latitude]',
      ),
  }),
  media_urls: z.array(z.string().url('media_urls must contain valid URLs')).default([]),
});

export const verifyReportBodySchema = z.object({
  txHash: trimmed('txHash'),
  originalDescription: trimmed('originalDescription'),
});

export const updateReportStatusBodySchema = z.object({
  originalTxHash: trimmed('originalTxHash'),
  status: trimmed('status'),
  evidence: z
    .string({
      invalid_type_error: 'evidence must be a string',
    })
    .trim()
    .optional(),
});

export const verifyStatusBodySchema = z.object({
  statusTxHash: trimmed('statusTxHash'),
  originalTxHash: trimmed('originalTxHash'),
  status: trimmed('status'),
  evidence: z
    .string({
      invalid_type_error: 'evidence must be a string',
    })
    .trim()
    .optional(),
});

const toNumber = (field: string) =>
  z
    .string({
      required_error: `${field} is required`,
      invalid_type_error: `${field} must be a number`,
    })
    .trim()
    .refine((value) => value.length > 0, `${field} is required`)
    .transform((value) => Number(value))
    .refine((value) => Number.isFinite(value), `${field} must be a valid number`);

const radiusQuerySchema = z.object({
  lat: toNumber('lat').refine((value) => value >= -90 && value <= 90, 'lat must be between -90 and 90'),
  lng: toNumber('lng').refine((value) => value >= -180 && value <= 180, 'lng must be between -180 and 180'),
  radiusInMeters: toNumber('radiusInMeters').refine(
    (value) => value > 0 && value <= 50_000,
    'radiusInMeters must be > 0 and <= 50000',
  ),
});

const boundsQuerySchema = z
  .object({
    minLat: toNumber('minLat'),
    maxLat: toNumber('maxLat'),
    minLng: toNumber('minLng'),
    maxLng: toNumber('maxLng'),
  })
  .refine((value) => value.minLat >= -90 && value.minLat <= 90, {
    message: 'minLat must be between -90 and 90',
    path: ['minLat'],
  })
  .refine((value) => value.maxLat >= -90 && value.maxLat <= 90, {
    message: 'maxLat must be between -90 and 90',
    path: ['maxLat'],
  })
  .refine((value) => value.minLng >= -180 && value.minLng <= 180, {
    message: 'minLng must be between -180 and 180',
    path: ['minLng'],
  })
  .refine((value) => value.maxLng >= -180 && value.maxLng <= 180, {
    message: 'maxLng must be between -180 and 180',
    path: ['maxLng'],
  })
  .refine((value) => value.minLat <= value.maxLat, {
    message: 'minLat must be <= maxLat',
    path: ['minLat'],
  })
  .refine((value) => value.minLng <= value.maxLng, {
    message: 'minLng must be <= maxLng',
    path: ['minLng'],
  });

export const reportsMapQuerySchema = z.union([radiusQuerySchema, boundsQuerySchema]);

export type CreateReportDTO = z.infer<typeof createReportBodySchema>;
export type VerifyReportDTO = z.infer<typeof verifyReportBodySchema>;
export type UpdateReportStatusDTO = z.infer<typeof updateReportStatusBodySchema>;
export type VerifyStatusDTO = z.infer<typeof verifyStatusBodySchema>;
export type ReportsMapQueryDTO = z.infer<typeof reportsMapQuerySchema>;
