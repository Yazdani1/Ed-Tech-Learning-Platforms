import { Schema, model, type Document, type Types } from 'mongoose';

export type EnrollmentType = 'free' | 'paid' | 'subscription';
/** Where the coupon of a paid enrolment came from: the course's own discount, a course coupon or a promo */
export type CouponSource = 'course' | 'coupon' | 'promo';
/** The payment page's methods (no gateway yet: the method is only recorded) */
export const PAYMENT_METHODS = ['bkash', 'other'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface IEnrollment extends Document {
  student: Types.ObjectId;
  course: Types.ObjectId;
  enrollmentType: EnrollmentType;
  listPrice: number;
  paidPrice: number;
  discountAmount: number;
  discountPercent: number;
  currency: string;
  couponCode?: string;
  couponSource?: CouponSource;
  paymentMethod?: PaymentMethod;
  /** VAT rate in force when bought, and the VAT included in paidPrice (internal) */
  vatPercent: number;
  vatAmount: number;
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
    couponCode: { type: String, uppercase: true, trim: true },
    couponSource: { type: String, enum: ['course', 'coupon', 'promo'] },
    paymentMethod: { type: String, enum: PAYMENT_METHODS },
    vatPercent: { type: Number, default: 0, min: 0, max: 100 },
    vatAmount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
// Course filters of the performance report and the students page
enrollmentSchema.index({ course: 1 });
// Coupon use counts (coupons page) and the revenue page (newest first)
enrollmentSchema.index({ couponCode: 1 }, { sparse: true });
enrollmentSchema.index({ createdAt: -1 });

export const Enrollment = model<IEnrollment>('Enrollment', enrollmentSchema);
