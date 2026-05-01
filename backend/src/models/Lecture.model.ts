import { Schema, model, type Document, type Types } from 'mongoose';

export interface ILecture extends Document {
  section: Types.ObjectId;
  title: string;
  description?: string;
  videoUrl?: string;
  order: number;
  isPreview: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const lectureSchema = new Schema<ILecture>(
  {
    section: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
    title: { type: String, required: true, trim: true },
    description: String,
    videoUrl: String,
    order: { type: Number, default: 0 },
    isPreview: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Lecture = model<ILecture>('Lecture', lectureSchema);
