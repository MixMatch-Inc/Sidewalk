import { Schema, model, type HydratedDocument, type Types } from "mongoose";

const STATUS_VALUES = [
  "PENDING",
  "ACKNOWLEDGED",
  "RESOLVED",
  "REJECTED",
  "ESCALATED",
] as const;

export type ReportStatusValue = (typeof STATUS_VALUES)[number];

export interface StatusUpdate {
  reportId: Types.ObjectId;
  previousStatus: ReportStatusValue;
  nextStatus: ReportStatusValue;
  note?: string;
  actorId?: Types.ObjectId;
}

const statusUpdateSchema = new Schema<StatusUpdate>(
  {
    reportId: {
      type: Schema.Types.ObjectId,
      ref: "Report",
      required: true,
      index: true,
    },
    previousStatus: {
      type: String,
      enum: STATUS_VALUES,
      required: true,
    },
    nextStatus: {
      type: String,
      enum: STATUS_VALUES,
      required: true,
      index: true,
    },
    note: {
      type: String,
      trim: true,
      required: false,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true },
);

statusUpdateSchema.index({ createdAt: -1 });

export type StatusUpdateDocument = HydratedDocument<StatusUpdate>;

export const StatusUpdateModel = model<StatusUpdate>("StatusUpdate", statusUpdateSchema);
