import { Schema, model, type HydratedDocument } from 'mongoose';

export interface MediaUpload {
  key: string;
  url: string;
  owner_user_id: string | null;
  draft_id: string | null;
  attached_report_id: string | null;
  expires_at: Date | null;
  mime: 'image/jpeg' | 'image/png' | 'image/webp';
  exif_gps: {
    latitude: number;
    longitude: number;
  } | null;
  exif_verified: boolean;
  processing_status: 'QUEUED' | 'PROCESSING' | 'DONE' | 'FAILED';
  processing_error: string | null;
  optimized_format: 'image/webp' | null;
  optimized_url: string | null;
}

const mediaUploadSchema = new Schema<MediaUpload>(
  {
    key: { type: String, required: true, unique: true, index: true },
    url: { type: String, required: true, unique: true, index: true },
    owner_user_id: { type: String, default: null, index: true },
    draft_id: { type: String, default: null, index: true },
    attached_report_id: { type: String, default: null, index: true },
    expires_at: { type: Date, default: null, index: true },
    mime: {
      type: String,
      required: true,
      enum: ['image/jpeg', 'image/png', 'image/webp'],
    },
    exif_gps: {
      type: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
      },
      default: null,
      required: false,
    },
    exif_verified: { type: Boolean, default: false, index: true },
    processing_status: {
      type: String,
      enum: ['QUEUED', 'PROCESSING', 'DONE', 'FAILED'],
      default: 'QUEUED',
      index: true,
    },
    processing_error: { type: String, default: null },
    optimized_format: {
      type: String,
      enum: ['image/webp'],
      default: null,
    },
    optimized_url: { type: String, default: null },
  },
  { timestamps: true },
);

export type MediaUploadDocument = HydratedDocument<MediaUpload>;

export const MediaUploadModel = model<MediaUpload>('MediaUpload', mediaUploadSchema);
