import { Schema, model, type Document, type Types } from 'mongoose';

export type CommunityPointRuleKey = 'acceptedAnswer' | 'createPost' | 'createReply' | 'receiveReaction';

export interface ICommunityPointRule extends Document {
  key: CommunityPointRuleKey;
  label: string;
  points: number;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const communityPointRuleSchema = new Schema<ICommunityPointRule>(
  {
    key: {
      type: String,
      enum: ['acceptedAnswer', 'createPost', 'createReply', 'receiveReaction'],
      required: true,
      unique: true,
    },
    label: { type: String, required: true, trim: true },
    points: { type: Number, required: true, min: 0 },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const CommunityPointRule = model<ICommunityPointRule>('CommunityPointRule', communityPointRuleSchema);
