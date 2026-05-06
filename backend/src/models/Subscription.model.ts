import { Schema, model, type Document, type Types } from 'mongoose';
import type { SubscriptionPlan } from '../types/index';

export type SubscriptionStatus = 'Active' | 'Expired' | 'Cancelled';

export interface ISubscription extends Document {
  user: Types.ObjectId;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  assignedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { type: String, enum: ['Basic', 'Premium', 'Gold', 'Quiz Only'], required: true },
    status: { type: String, enum: ['Active', 'Expired', 'Cancelled'], default: 'Active' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

subscriptionSchema.index({ user: 1 });

export const Subscription = model<ISubscription>('Subscription', subscriptionSchema);
