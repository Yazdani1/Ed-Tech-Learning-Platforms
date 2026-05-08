import { Schema, model, type Document, type Types } from 'mongoose';

export interface IQuizOption {
  _id?: Types.ObjectId;
  text: string;
  explanation?: string;
}

export interface IQuizQuestion {
  _id: Types.ObjectId;
  question: string;
  options: IQuizOption[];
  correctOptionIndices: number[];
  order: number;
}

export type QuizContextType = 'Section' | 'Announcement' | 'Course';

export interface IQuizBank extends Document {
  course: Types.ObjectId;
  quizSection?: Types.ObjectId;
  contextType?: QuizContextType;
  contextId?: Types.ObjectId;
  title: string;
  description?: string;
  isFreePreview: boolean;
  questions: IQuizQuestion[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const quizOptionSchema = new Schema<IQuizOption>({
  text: { type: String, required: true },
  explanation: { type: String },
});

const quizQuestionSchema = new Schema<IQuizQuestion>({
  question: { type: String, required: true },
  options: {
    type: [quizOptionSchema],
    validate: {
      validator: (v: unknown[]) => v.length === 4,
      message: 'Must have exactly 4 options',
    },
  },
  correctOptionIndices: {
    type: [Number],
    validate: {
      validator: (v: number[]) =>
        v.length >= 1 && v.every((i) => i >= 0 && i <= 3),
      message: 'At least one correct index (0–3) required',
    },
  },
  order: { type: Number, default: 0 },
});

const quizBankSchema = new Schema<IQuizBank>(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    quizSection: { type: Schema.Types.ObjectId, ref: 'QuizSection' },
    contextType: {
      type: String,
      enum: ['Section', 'Announcement', 'Course'],
    },
    contextId: { type: Schema.Types.ObjectId },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    isFreePreview: { type: Boolean, default: false },
    questions: { type: [quizQuestionSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

quizBankSchema.index({ course: 1 });
quizBankSchema.index({ quizSection: 1 });
quizBankSchema.index({ contextType: 1, contextId: 1 });

export const QuizBank = model<IQuizBank>('QuizBank', quizBankSchema);
