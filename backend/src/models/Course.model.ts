import { Schema, model, type Document, type Types } from 'mongoose';
import type { CourseVisibility, CoursePricing, CourseStatus, SubscriptionPlan } from '../types/index';

/** An image uploaded for a course section (POST /api/courses/:id/images). */
export interface ICourseImage {
  url: string;
  publicId: string;
}

export interface ICourseToolsSection {
  title?: string;
  description?: string;
  tools: Types.ObjectId[];
}

export interface ICourseBenefit {
  title: string;
  description?: string;
  icon?: ICourseImage;
}

export interface ICourseBenefitsSection {
  title?: string;
  description?: string;
  items: ICourseBenefit[];
}

export interface ICourseProject {
  title: string;
  description?: string;
  images: ICourseImage[];
  liveDemoUrl?: string;
  videoUrl?: string;
}

export interface ICourseSuccessStory {
  title: string;
  description?: string;
  companyName?: string;
  photo?: ICourseImage;
  companyLogo?: ICourseImage;
}

export interface ICourseFaq {
  question: string;
  answer: string;
}

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
  /** The course's own discount works as its auto coupon: this code is pre-filled on the course and payment pages */
  discountCode?: string;
  discountStartsAt?: Date;
  includedInSubscription: boolean;
  allowedSubscriptionPlans: SubscriptionPlan[];
  status: CourseStatus;
  publishedAt?: Date;
  /** Set the first time the course is published and never cleared: such a course can never be deleted */
  firstPublishedAt?: Date;
  /** 4 digits, unique across all courses */
  batchNumber?: string;
  /** Plain text, e.g. "Sat and Mon, 9-11 PM" */
  liveClassSchedule?: string;
  supportClassSchedule?: string;
  /** Course page visits (one per visitor per day) */
  viewCount: number;
  whatYouWillLearn: string[];
  whatYouWillGet: string[];
  requirements: string[];
  sections: Types.ObjectId[];
  toolsSection?: ICourseToolsSection;
  benefitsSection?: ICourseBenefitsSection;
  projects: ICourseProject[];
  audience: string[];
  successStories: ICourseSuccessStory[];
  faqs: ICourseFaq[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const imageSchema = new Schema<ICourseImage>(
  { url: { type: String, required: true }, publicId: { type: String, required: true } },
  { _id: false }
);

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
    discountCode: { type: String, uppercase: true, trim: true },
    discountStartsAt: { type: Date },
    includedInSubscription: { type: Boolean, default: false },
    allowedSubscriptionPlans: [{ type: String, trim: true }],
    status: { type: String, enum: ['Draft', 'Published'], default: 'Draft' },
    publishedAt: { type: Date },
    firstPublishedAt: { type: Date },
    batchNumber: { type: String, trim: true },
    liveClassSchedule: { type: String, trim: true, maxlength: 200 },
    supportClassSchedule: { type: String, trim: true, maxlength: 200 },
    viewCount: { type: Number, default: 0, min: 0 },
    whatYouWillLearn: [String],
    whatYouWillGet: [String],
    requirements: [String],
    sections: [{ type: Schema.Types.ObjectId, ref: 'Section' }],
    // Course page sections (PATCH /api/courses/:id/extras; list sizes are capped in utils/courseExtras)
    toolsSection: {
      title: String,
      description: String,
      tools: [{ type: Schema.Types.ObjectId, ref: 'Tool', index: true }],
    },
    benefitsSection: {
      title: String,
      description: String,
      items: [{ title: { type: String, required: true }, description: String, icon: imageSchema }],
    },
    projects: [
      {
        title: { type: String, required: true },
        description: String,
        images: [imageSchema],
        liveDemoUrl: String,
        videoUrl: String,
      },
    ],
    audience: [String],
    successStories: [
      {
        title: { type: String, required: true },
        description: String,
        companyName: String,
        photo: imageSchema,
        companyLogo: imageSchema,
      },
    ],
    faqs: [{ question: { type: String, required: true }, answer: { type: String, required: true } }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Unique when set (older courses get a batch number at start-up)
courseSchema.index({ batchNumber: 1 }, { unique: true, partialFilterExpression: { batchNumber: { $type: 'string' } } });
courseSchema.index({ discountCode: 1 }, { unique: true, partialFilterExpression: { discountCode: { $type: 'string' } } });

export const Course = model<ICourse>('Course', courseSchema);
