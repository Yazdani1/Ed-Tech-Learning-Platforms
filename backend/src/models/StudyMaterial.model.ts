import { Schema, model, type Document, type Types } from 'mongoose';

export interface IStudyMaterial extends Document {
  course: Types.ObjectId;
  title: string;
  description: string;
  fileUrl?: string;
  postedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const studyMaterialSchema = new Schema<IStudyMaterial>(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    fileUrl: { type: String, trim: true },
    postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

studyMaterialSchema.index({ course: 1, createdAt: -1 });

export const StudyMaterial = model<IStudyMaterial>('StudyMaterial', studyMaterialSchema);
