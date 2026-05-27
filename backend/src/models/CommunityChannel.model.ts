import { Schema, model, type Document, type Types } from 'mongoose';

export interface ICommunityChannel extends Document {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  imagePublicId?: string;
  isArchived: boolean;
  createdBy: Types.ObjectId;
  archivedBy?: Types.ObjectId;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const communityChannelSchema = new Schema<ICommunityChannel>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true },
    imageUrl: String,
    imagePublicId: { type: String, select: false },
    isArchived: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    archivedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    archivedAt: Date,
  },
  { timestamps: true }
);

communityChannelSchema.index({ isArchived: 1, name: 1 });

export const CommunityChannel = model<ICommunityChannel>('CommunityChannel', communityChannelSchema);
