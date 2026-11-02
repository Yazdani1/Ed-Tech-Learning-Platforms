import { Schema, model, type Document } from 'mongoose';

export interface ICourseType extends Document {
  name: string;
  slug: string;
  description?: string;
  /** Courses of this type are "live" courses (the home page's Live Courses section) */
  isLive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const courseTypeSchema = new Schema<ICourseType>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: String,
    isLive: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const CourseType = model<ICourseType>('CourseType', courseTypeSchema);
