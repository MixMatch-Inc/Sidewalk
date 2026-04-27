import { Schema, model, type HydratedDocument } from 'mongoose';

export const REPORT_STATUSES = [
  'PENDING',
  'ACKNOWLEDGED',
  'RESOLVED',
  'REJECTED',
  'ESCALATED',
] as const;

export const REPORT_CATEGORIES = [
  'INFRASTRUCTURE',
  'SANITATION',
  'SAFETY',
  'LIGHTING',
  'TRANSPORT',
  'DRAINAGE',
  'UTILITIES',
  'TRAFFIC',
  'OTHER',
] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];
export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export type ReportLocation = {
  type: 'Point';
  coordinates: [number, number];
};

export interface Report {
  reporter_user_id: string | null;
  district?: string | null;
  data_hash: string;
  anchor_status: 'ANCHOR_QUEUED' | 'ANCHOR_SUCCESS' | 'ANCHOR_FAILED';
  anchor_attempts: number;
  anchor_last_error: string | null;
  anchor_needs_attention: boolean;
  anchor_failed_at: Date | null;
  title: string;
  description: string;
  status: ReportStatus;
  category: ReportCategory;
  location: ReportLocation;
  stellar_tx_hash: string | null;
  snapshot_hash: string | null;
  media_urls: string[];
  exif_verified: boolean;
  exif_distance_meters: number | null;
  integrity_flag: 'NORMAL' | 'SUSPICIOUS';
  public_slug: string;
}

const stripHtml = (value: string): string =>
  value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const isValidLongitude = (value: number) =>
  Number.isFinite(value) && value >= -180 && value <= 180;
const isValidLatitude = (value: number) =>
  Number.isFinite(value) && value >= -90 && value <= 90;

const reportSchema = new Schema<Report>(
  {
    reporter_user_id: {
      type: String,
      default: null,
      index: true,
    },
    district: {
      type: String,
      default: null,
      index: true,
    },
    data_hash: {
      type: String,
      required: true,
      index: true,
    },
    anchor_status: {
      type: String,
      enum: ['ANCHOR_QUEUED', 'ANCHOR_SUCCESS', 'ANCHOR_FAILED'],
      default: 'ANCHOR_QUEUED',
      index: true,
    },
    anchor_attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    anchor_last_error: {
      type: String,
      default: null,
    },
    anchor_needs_attention: {
      type: Boolean,
      default: false,
      index: true,
    },
    anchor_failed_at: {
      type: Date,
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: true,
      set: (value: string) => stripHtml(value),
      validate: {
        validator: (value: string) => value.length > 0,
        message: 'title is required',
      },
    },
    description: {
      type: String,
      required: true,
      set: (value: string) => stripHtml(value),
      validate: {
        validator: (value: string) => value.length > 0,
        message: 'description is required',
      },
    },
    status: {
      type: String,
      enum: REPORT_STATUSES,
      default: 'PENDING',
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: REPORT_CATEGORIES,
      required: true,
      index: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: [
          {
            validator: (coordinates: number[]) =>
              Array.isArray(coordinates) && coordinates.length === 2,
            message: 'location.coordinates must contain [longitude, latitude]',
          },
          {
            validator: (coordinates: number[]) =>
              coordinates.length === 2 &&
              isValidLongitude(coordinates[0]) &&
              isValidLatitude(coordinates[1]),
            message:
              'location.coordinates must be valid and ordered [longitude, latitude]',
          },
        ],
      },
    },
    stellar_tx_hash: {
      type: String,
      default: null,
      index: true,
    },
    snapshot_hash: {
      type: String,
      default: null,
      index: true,
    },
    media_urls: {
      type: [String],
      default: [],
    },
    exif_verified: {
      type: Boolean,
      default: false,
      index: true,
    },
    exif_distance_meters: {
      type: Number,
      default: null,
      index: true,
    },
    integrity_flag: {
      type: String,
      enum: ['NORMAL', 'SUSPICIOUS'],
      default: 'NORMAL',
      index: true,
    },
    public_slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      validate: {
        validator: (value: string) => /^[a-z][a-z0-9]{7}$/.test(value),
        message: 'public_slug must be 8 characters starting with a letter',
      },
    },
  },
  { timestamps: true },
);

reportSchema.index({ location: '2dsphere' });
reportSchema.index({ status: 1, createdAt: -1 });

export type ReportDocument = HydratedDocument<Report>;

export const ReportModel = model<Report>('Report', reportSchema);
