import { Schema, model, type Document, type Types } from 'mongoose';

export interface IQuestion extends Document {
  course: Types.ObjectId;
  title: string;
  description: string;
  postedBy: Types.ObjectId;
  upvotes: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    upvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true },
);

questionSchema.index({ course: 1, createdAt: -1 });

export const Question = model<IQuestion>('Question', questionSchema);
