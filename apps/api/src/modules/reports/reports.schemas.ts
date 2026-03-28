import { z } from 'zod';

const trimmed = (label: string) =>
  z
    .string({
      required_error: `${label} is required`,
      invalid_type_error: `${label} must be a string`,
    })
    .trim()
    .min(1, `${label} is required`);

const reportSnapshotPayloadSchema = z.object({
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
    coordinates: z.tuple([z.number(), z.number()]),
  }),
  media_urls: z.array(z.string().url('media_urls must contain valid URLs')).default([]),
  draft_id: z
    .string({
      invalid_type_error: 'draft_id must be a string',
    })
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, 'draft_id must be a valid id')
    .optional(),
});

export const createReportBodySchema = z.object({
  ...reportSnapshotPayloadSchema.shape,
});

export const verifyReportBodySchema = z
  .object({
  txHash: trimmed('txHash'),
    originalDescription: trimmed('originalDescription').optional(),
    report: reportSnapshotPayloadSchema.optional(),
  })
  .refine((value) => value.originalDescription || value.report, {
    message: 'Either originalDescription or report is required',
    path: ['report'],
  });

export const myReportsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
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

const optionalTrimmed = () =>
  z
    .string({
      invalid_type_error: 'value must be a string',
    })
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined));

const positiveInt = (field: string, fallback: number) =>
  z
    .string({
      invalid_type_error: `${field} must be a number`,
    })
    .trim()
    .optional()
    .transform((value) => {
      if (!value) {
        return fallback;
      }

      return Number(value);
    })
    .refine((value) => Number.isInteger(value) && value > 0, `${field} must be a positive integer`);

export const reportListQuerySchema = z.object({
  page: positiveInt('page', 1),
  pageSize: positiveInt('pageSize', 20).refine((value) => value <= 100, 'pageSize must be <= 100'),
  status: optionalTrimmed(),
  category: optionalTrimmed(),
  mine: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});

export const reportDetailParamsSchema = z.object({
  reportId: trimmed('reportId'),
});

export type CreateReportDTO = z.infer<typeof createReportBodySchema>;
export type VerifyReportDTO = z.infer<typeof verifyReportBodySchema>;
export type UpdateReportStatusDTO = z.infer<typeof updateReportStatusBodySchema>;
export type VerifyStatusDTO = z.infer<typeof verifyStatusBodySchema>;
export type ReportsMapQueryDTO = z.infer<typeof reportsMapQuerySchema>;
export type ReportListQueryDTO = z.infer<typeof reportListQuerySchema>;
export type ReportDetailParamsDTO = z.infer<typeof reportDetailParamsSchema>;
