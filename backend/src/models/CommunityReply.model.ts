import { Schema, model, type Document, type Types } from 'mongoose';
import type { ICommunityReaction } from './CommunityPost.model';

export interface ICommunityReply extends Document {
  post: Types.ObjectId;
  body: string;
  author: Types.ObjectId;
  reactions: ICommunityReaction[];
  isAccepted: boolean;
  acceptedAt?: Date;
  acceptedPointsAwarded: boolean;
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

const communityReplySchema = new Schema<ICommunityReply>(
  {
    post: { type: Schema.Types.ObjectId, ref: 'CommunityPost', required: true },
    body: { type: String, required: true, trim: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reactions: [reactionSchema],
    isAccepted: { type: Boolean, default: false },
    acceptedAt: Date,
    acceptedPointsAwarded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

communityReplySchema.index({ post: 1, isAccepted: -1, createdAt: 1 });

export const CommunityReply = model<ICommunityReply>('CommunityReply', communityReplySchema);
