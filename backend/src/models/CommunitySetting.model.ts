import { Schema, model, type Document, type Types } from 'mongoose';

export interface ICommunitySetting extends Document {
  title: string;
  description: string;
  headerImageUrl?: string;
  headerImagePublicId?: string;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const communitySettingSchema = new Schema<ICommunitySetting>(
  {
    title: { type: String, trim: true, default: 'Community Hub' },
    description: {
      type: String,
      trim: true,
      default: 'Find study questions, tech discussions, accepted answers, reactions, points, and badges.',
    },
    headerImageUrl: String,
    headerImagePublicId: { type: String, select: false },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const CommunitySetting = model<ICommunitySetting>('CommunitySetting', communitySettingSchema);
