import { Schema, model, type Document, type Types } from 'mongoose';

export interface IAnswer extends Document {
  question: Types.ObjectId;
  body: string;
  postedBy: Types.ObjectId;
  upvotes: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const answerSchema = new Schema<IAnswer>(
  {
    question: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    body: { type: String, required: true },
    postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    upvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true },
);

answerSchema.index({ question: 1, createdAt: 1 });

export const Answer = model<IAnswer>('Answer', answerSchema);
