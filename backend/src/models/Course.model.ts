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
  teachers: Types.ObjectId[];
  visibility: CourseVisibility;
  pricing: CoursePricing;
  price?: number;
  includedInSubscription: boolean;
  allowedSubscriptionPlans: SubscriptionPlan[];
  status: CourseStatus;
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
    coverImagePublicId: String,
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    courseType: { type: Schema.Types.ObjectId, ref: 'CourseType' },
    teachers: [{ type: Schema.Types.ObjectId, ref: 'Teacher' }],
    visibility: { type: String, enum: ['Public', 'Private'], default: 'Private' },
    pricing: { type: String, enum: ['Free', 'Paid'], default: 'Free' },
    price: { type: Number, min: 0 },
    includedInSubscription: { type: Boolean, default: false },
    allowedSubscriptionPlans: [{ type: String, enum: ['Basic', 'Premium', 'Gold', 'Quiz Only'] }],
    status: { type: String, enum: ['Draft', 'Published'], default: 'Draft' },
    whatYouWillLearn: [String],
    whatYouWillGet: [String],
    requirements: [String],
    sections: [{ type: Schema.Types.ObjectId, ref: 'Section' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Course = model<ICourse>('Course', courseSchema);
