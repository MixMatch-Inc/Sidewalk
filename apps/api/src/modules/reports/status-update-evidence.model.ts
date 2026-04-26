import { Schema, model, type HydratedDocument, type Types } from 'mongoose';
import { type ReportStatusValue } from './status-update.model.js';

const STATUS_VALUES = [
  'PENDING',
  'ACKNOWLEDGED',
  'RESOLVED',
  'REJECTED',
  'ESCALATED',
] as const;

export interface EvidenceMetadata {
  summary: string;
  attachmentRefs: string[];
  capturedAt?: Date;
}

export interface StatusUpdateWithEvidence {
  reportId: Types.ObjectId;
  previousStatus: ReportStatusValue;
  nextStatus: ReportStatusValue;
  note?: string;
  actorId?: Types.ObjectId;
  evidence?: EvidenceMetadata;
}

const evidenceSchema = new Schema<EvidenceMetadata>(
  {
    summary: { type: String, required: true, trim: true },
    attachmentRefs: { type: [String], default: [] },
    capturedAt: { type: Date },
  },
  { _id: false },
);

const statusUpdateWithEvidenceSchema = new Schema<StatusUpdateWithEvidence>(
  {
    reportId: {
      type: Schema.Types.ObjectId,
      ref: 'Report',
      required: true,
      index: true,
    },
    previousStatus: { type: String, enum: STATUS_VALUES, required: true },
    nextStatus: { type: String, enum: STATUS_VALUES, required: true, index: true },
    note: { type: String, trim: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    evidence: { type: evidenceSchema, required: false },
  },
  { timestamps: true },
);

statusUpdateWithEvidenceSchema.index({ createdAt: -1 });

export type StatusUpdateWithEvidenceDocument =
  HydratedDocument<StatusUpdateWithEvidence>;

export const StatusUpdateWithEvidenceModel = model<StatusUpdateWithEvidence>(
  'StatusUpdateWithEvidence',
  statusUpdateWithEvidenceSchema,
);
