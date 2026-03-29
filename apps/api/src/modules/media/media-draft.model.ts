import { Schema, model, type HydratedDocument } from 'mongoose';

export interface MediaDraft {
  owner_user_id: string;
  status: 'OPEN' | 'FINALIZED' | 'EXPIRED';
  expires_at: Date;
}

const mediaDraftSchema = new Schema<MediaDraft>(
  {
    owner_user_id: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'FINALIZED', 'EXPIRED'],
      default: 'OPEN',
      index: true,
    },
    expires_at: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

export type MediaDraftDocument = HydratedDocument<MediaDraft>;

export const MediaDraftModel = model<MediaDraft>('MediaDraft', mediaDraftSchema);
