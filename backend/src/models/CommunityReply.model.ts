import { Schema, model, type Document, type Types } from 'mongoose';
import type { ICommunityImage, ICommunityReaction } from './CommunityPost.model';

export interface ICommunityReply extends Document {
  post: Types.ObjectId;
  body: string;
  author: Types.ObjectId;
  images: ICommunityImage[];
  reactions: ICommunityReaction[];
  isAccepted: boolean;
  acceptedAt?: Date;
  acceptedPointsAwarded: boolean;
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

const communityReplySchema = new Schema<ICommunityReply>(
  {
    post: { type: Schema.Types.ObjectId, ref: 'CommunityPost', required: true },
    body: { type: String, required: true, trim: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    images: [communityImageSchema],
    reactions: [reactionSchema],
    isAccepted: { type: Boolean, default: false },
    acceptedAt: Date,
    acceptedPointsAwarded: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    archivedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    archivedAt: Date,
  },
  { timestamps: true }
);

communityReplySchema.index({ post: 1, isArchived: 1, isAccepted: -1, createdAt: 1 });

export const CommunityReply = model<ICommunityReply>('CommunityReply', communityReplySchema);
