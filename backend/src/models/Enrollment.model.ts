import { Schema, model, type Document, type Types } from 'mongoose';

export type EnrollmentType = 'free' | 'paid' | 'subscription';

export interface IEnrollment extends Document {
  student: Types.ObjectId;
  course: Types.ObjectId;
  enrollmentType: EnrollmentType;
  listPrice: number;
  paidPrice: number;
  discountAmount: number;
  discountPercent: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    enrollmentType: {
      type: String,
      enum: ['free', 'paid', 'subscription'],
      default: 'free',
    },
    listPrice: { type: Number, default: 0, min: 0 },
    paidPrice: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    currency: { type: String, default: 'BDT' },
  },
  { timestamps: true },
);

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

export const Enrollment = model<IEnrollment>('Enrollment', enrollmentSchema);
