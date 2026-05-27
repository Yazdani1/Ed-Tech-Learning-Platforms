import { Schema, model, type Document, type Types } from 'mongoose';

export interface ICommunityAnswerReply extends Document {
  reply: Types.ObjectId;
  body: string;
  author: Types.ObjectId;
  isArchived: boolean;
  archivedBy?: Types.ObjectId;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const communityAnswerReplySchema = new Schema<ICommunityAnswerReply>(
  {
    reply: { type: Schema.Types.ObjectId, ref: 'CommunityReply', required: true },
    body: { type: String, required: true, trim: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isArchived: { type: Boolean, default: false },
    archivedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    archivedAt: Date,
  },
  { timestamps: true }
);

communityAnswerReplySchema.index({ reply: 1, isArchived: 1, createdAt: 1 });

export const CommunityAnswerReply = model<ICommunityAnswerReply>('CommunityAnswerReply', communityAnswerReplySchema);
