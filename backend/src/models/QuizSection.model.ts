import { Schema, model, type Document, type Types } from 'mongoose';

export interface IQuizSection extends Document {
  course: Types.ObjectId;
  title: string;
  order: number;
  isFreePreview: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const quizSectionSchema = new Schema<IQuizSection>(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    isFreePreview: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

quizSectionSchema.index({ course: 1, order: 1 });

export const QuizSection = model<IQuizSection>('QuizSection', quizSectionSchema);
