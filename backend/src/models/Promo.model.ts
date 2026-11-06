import { Schema, model, type Document, type Types } from 'mongoose';

import type { DiscountType } from './Coupon.model';

/** A promo for several published paid courses: home banner, pop-up and the promo courses page while it runs. */
export interface IPromo extends Document {
  title: string;
  code: string;
  discountType: DiscountType;
  value: number;
  startsAt: Date;
  endsAt: Date;
  courses: Types.ObjectId[];
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const promoSchema = new Schema<IPromo>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    code: { type: String, required: true, uppercase: true, trim: true, unique: true },
    discountType: { type: String, enum: ['percent', 'amount'], required: true },
    value: { type: Number, required: true, min: 0 },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    courses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

promoSchema.index({ isActive: 1, startsAt: 1, endsAt: 1 });

export const Promo = model<IPromo>('Promo', promoSchema);
