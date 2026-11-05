import { Schema, model, type Document } from 'mongoose';

export interface ICourseType extends Document {
  name: string;
  slug: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const courseTypeSchema = new Schema<ICourseType>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: String,
  },
  { timestamps: true }
);

export const CourseType = model<ICourseType>('CourseType', courseTypeSchema);
