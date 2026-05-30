import { Schema, model, type Document, type Types } from 'mongoose';

export interface ICommunityBadge extends Document {
  name: string;
  imageUrl?: string;
  imagePublicId?: string;
  requiredPoints: number;
  isArchived: boolean;
  createdBy: Types.ObjectId;
  archivedBy?: Types.ObjectId;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const communityBadgeSchema = new Schema<ICommunityBadge>(
  {
    name: { type: String, required: true, trim: true },
    imageUrl: String,
    imagePublicId: { type: String, select: false },
    requiredPoints: { type: Number, required: true, min: 0 },
    isArchived: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    archivedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    archivedAt: Date,
  },
  { timestamps: true }
);

communityBadgeSchema.index({ isArchived: 1, requiredPoints: 1 });

export const CommunityBadge = model<ICommunityBadge>('CommunityBadge', communityBadgeSchema);
