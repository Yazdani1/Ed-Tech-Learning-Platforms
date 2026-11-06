import { Schema, model, type Document } from 'mongoose';

export interface ICourseType extends Document {
  name: string;
  slug: string;
  description?: string;
  /** Order of the course type boxes on the home page and catalog (1 = first); null = after the numbered ones */
  position?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const courseTypeSchema = new Schema<ICourseType>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: String,
    position: { type: Number, min: 1, max: 999, default: null },
  },
  { timestamps: true }
);

export const CourseType = model<ICourseType>('CourseType', courseTypeSchema);
