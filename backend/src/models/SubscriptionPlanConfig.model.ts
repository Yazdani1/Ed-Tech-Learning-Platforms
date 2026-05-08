import { Schema, model, type Document, type Types } from 'mongoose';
import type { SubscriptionPlan } from '../types/index';

export interface ISubscriptionPlanConfig extends Document {
  plan: SubscriptionPlan;
  price: number;
  duration: number; // months
  billingOptions: Array<{
    label: string;
    duration: number;
    price: number;
  }>;
  features: string[];
  badge?: string;
  color?: string;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionPlanConfigSchema = new Schema<ISubscriptionPlanConfig>(
  {
    plan: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    price: { type: Number, required: true, min: 0 },
    duration: { type: Number, required: true, default: 1 },
    billingOptions: [
      {
        label: { type: String, required: true, trim: true },
        duration: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
      },
    ],
    features: [{ type: String }],
    badge: { type: String },
    color: { type: String },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const SubscriptionPlanConfig = model<ISubscriptionPlanConfig>(
  'SubscriptionPlanConfig',
  subscriptionPlanConfigSchema
);
