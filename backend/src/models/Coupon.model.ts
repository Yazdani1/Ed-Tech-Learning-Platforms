import { Schema, model, type Document, type Types } from 'mongoose';

export type DiscountType = 'percent' | 'amount';

/** A coupon of one course (Course > Coupons page). The course's own discount is not stored here (Course.discountCode). */
export interface ICoupon extends Document {
  course: Types.ObjectId;
  code: string;
  discountType: DiscountType;
  /** Percent (1-100) or an amount in BDT */
  value: number;
  startsAt?: Date;
  endsAt?: Date;
  /** null = unlimited */
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    code: { type: String, required: true, uppercase: true, trim: true, unique: true },
    discountType: { type: String, enum: ['percent', 'amount'], required: true },
    value: { type: Number, required: true, min: 0 },
    startsAt: { type: Date },
    endsAt: { type: Date },
    usageLimit: { type: Number, min: 1, default: null },
    usedCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

export const Coupon = model<ICoupon>('Coupon', couponSchema);
