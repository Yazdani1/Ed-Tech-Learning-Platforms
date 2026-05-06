import { Schema, model, type Document, type Types } from 'mongoose';
import type { UserRole, SubscriptionPlan } from '../types/index';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
  avatarPublicId?: string;
  activeSubscription?: {
    plan: SubscriptionPlan;
    startDate: Date;
    endDate: Date;
  };
  purchasedCourses: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['Super Admin', 'Admin', 'Moderator', 'Teacher', 'Student'],
      default: 'Student',
    },
    avatar: String,
    avatarPublicId: { type: String, select: false },
    activeSubscription: {
      plan: { type: String, enum: ['Basic', 'Premium', 'Gold', 'Quiz Only'] },
      startDate: Date,
      endDate: Date,
    },
    purchasedCourses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
  },
  { timestamps: true }
);

userSchema.index({ createdAt: -1 });
userSchema.index({ role: 1, createdAt: -1 });

export const User = model<IUser>('User', userSchema);
