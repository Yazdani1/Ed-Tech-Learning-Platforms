import { Schema, model, type Document, type Types } from 'mongoose';
import type { CourseVisibility, CoursePricing, CourseStatus, SubscriptionPlan } from '../types/index';

export interface ICourse extends Document {
  title: string;
  subtitle?: string;
  description: string;
  coverImage?: string;
  coverImagePublicId?: string;
  category: Types.ObjectId;
  courseType: Types.ObjectId;
  startDate?: Date;
  endDate?: Date;
  teachers: Types.ObjectId[];
  visibility: CourseVisibility;
  pricing: CoursePricing;
  price?: number;
  listPrice?: number;
  discountPrice?: number;
  discountPercent?: number;
  discountEndsAt?: Date;
  includedInSubscription: boolean;
  allowedSubscriptionPlans: SubscriptionPlan[];
  status: CourseStatus;
  publishedAt?: Date;
  whatYouWillLearn: string[];
  whatYouWillGet: string[];
  requirements: string[];
  sections: Types.ObjectId[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    subtitle: String,
    description: { type: String, default: '' },
    coverImage: String,
    coverImagePublicId: { type: String, select: false },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    courseType: { type: Schema.Types.ObjectId, ref: 'CourseType' },
    startDate: { type: Date },
    endDate: { type: Date },
    teachers: [{ type: Schema.Types.ObjectId, ref: 'Teacher' }],
    visibility: { type: String, enum: ['Public', 'Private'], default: 'Private' },
    pricing: { type: String, enum: ['Free', 'Paid'], default: 'Free' },
    price: { type: Number, min: 0 },
    listPrice: { type: Number, min: 0 },
    discountPrice: { type: Number, min: 0 },
    discountPercent: { type: Number, min: 0, max: 100 },
    discountEndsAt: { type: Date },
    includedInSubscription: { type: Boolean, default: false },
    allowedSubscriptionPlans: [{ type: String, trim: true }],
    status: { type: String, enum: ['Draft', 'Published'], default: 'Draft' },
    publishedAt: { type: Date },
    whatYouWillLearn: [String],
    whatYouWillGet: [String],
    requirements: [String],
    sections: [{ type: Schema.Types.ObjectId, ref: 'Section' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Course = model<ICourse>('Course', courseSchema);
