import { Schema, model, type HydratedDocument, type Types } from 'mongoose';

const ASSIGNMENT_STATUSES = ['ACTIVE', 'REASSIGNED', 'RELEASED'] as const;

export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

export interface ReportAssignment {
  reportId: Types.ObjectId;
  assigneeId: Types.ObjectId;
  actorId: Types.ObjectId;
  status: AssignmentStatus;
  note?: string;
  assignedAt: Date;
  releasedAt?: Date;
}

const reportAssignmentSchema = new Schema<ReportAssignment>(
  {
    reportId: {
      type: Schema.Types.ObjectId,
      ref: 'Report',
      required: true,
      index: true,
    },
    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ASSIGNMENT_STATUSES,
      default: 'ACTIVE',
      index: true,
    },
    note: { type: String, trim: true },
    assignedAt: { type: Date, default: () => new Date() },
    releasedAt: { type: Date },
  },
  { timestamps: true },
);

reportAssignmentSchema.index({ reportId: 1, status: 1 });

export type ReportAssignmentDocument = HydratedDocument<ReportAssignment>;

export const ReportAssignmentModel = model<ReportAssignment>(
  'ReportAssignment',
  reportAssignmentSchema,
);
