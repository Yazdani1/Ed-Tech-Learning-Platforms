import { Schema, model, type Document, type Types } from 'mongoose';

export type CommunityReactionType = 'Like' | 'Love' | 'Wow' | 'Sad' | 'Angry' | 'Helpful';

export interface ICommunityReaction {
  user: Types.ObjectId;
  type: CommunityReactionType;
  createdAt: Date;
}

export interface ICommunityImage {
  url: string;
  publicId?: string;
}

export interface ICommunityPost extends Document {
  channel: Types.ObjectId;
  title: string;
  description: string;
  imageUrl?: string;
  imagePublicId?: string;
  images: ICommunityImage[];
  author: Types.ObjectId;
  reactions: ICommunityReaction[];
  isPinned: boolean;
  pinnedBy?: Types.ObjectId;
  pinnedAt?: Date;
  isArchived: boolean;
  archivedBy?: Types.ObjectId;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const reactionSchema = new Schema<ICommunityReaction>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['Like', 'Love', 'Wow', 'Sad', 'Angry', 'Helpful'],
      required: true,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const communityImageSchema = new Schema<ICommunityImage>(
  {
    url: { type: String, required: true },
    publicId: { type: String, select: false },
  },
  { _id: false }
);

const communityPostSchema = new Schema<ICommunityPost>(
  {
    channel: { type: Schema.Types.ObjectId, ref: 'CommunityChannel', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    imageUrl: String,
    imagePublicId: { type: String, select: false },
    images: [communityImageSchema],
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reactions: [reactionSchema],
    isPinned: { type: Boolean, default: false },
    pinnedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    pinnedAt: Date,
    isArchived: { type: Boolean, default: false },
    archivedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    archivedAt: Date,
  },
  { timestamps: true }
);

communityPostSchema.index({ isArchived: 1, isPinned: -1, createdAt: -1 });
communityPostSchema.index({ channel: 1, isArchived: 1, isPinned: -1, createdAt: -1 });

export const CommunityPost = model<ICommunityPost>('CommunityPost', communityPostSchema);
