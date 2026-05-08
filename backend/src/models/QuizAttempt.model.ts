import { Schema, model, type Document, type Types } from 'mongoose';

export interface IAttemptAnswer {
  questionId: Types.ObjectId;
  selectedOptionIndices: number[];
  isCorrect: boolean;
}

export interface IQuizAttempt extends Document {
  student: Types.ObjectId;
  quizBank: Types.ObjectId;
  course: Types.ObjectId;
  answers: IAttemptAnswer[];
  createdAt: Date;
  updatedAt: Date;
}

const attemptAnswerSchema = new Schema<IAttemptAnswer>(
  {
    questionId: { type: Schema.Types.ObjectId, required: true },
    selectedOptionIndices: { type: [Number], default: [] },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false },
);

const quizAttemptSchema = new Schema<IQuizAttempt>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    quizBank: { type: Schema.Types.ObjectId, ref: 'QuizBank', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    answers: { type: [attemptAnswerSchema], default: [] },
  },
  { timestamps: true },
);

quizAttemptSchema.index({ student: 1, quizBank: 1 }, { unique: true });

export const QuizAttempt = model<IQuizAttempt>('QuizAttempt', quizAttemptSchema);
