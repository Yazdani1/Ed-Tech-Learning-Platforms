import { Schema, model, type Document, type Types } from 'mongoose';
import type { UserRole, SubscriptionPlan } from '../types/index';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  passwordChangedAt?: Date;
  role: UserRole;
  /** Students only: unique 9-digit number shown as 123-456-789 (set on creation, never changes) */
  studentNumber?: string;
  avatar?: string;
  avatarPublicId?: string;
  communityPoints: number;
  isCommunityProfilePrivate: boolean;
  activeSubscription?: {
    plan: SubscriptionPlan;
    billingDuration?: number;
    billingLabel?: string;
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
    // Tokens issued before this moment are rejected (set when the password changes).
    passwordChangedAt: { type: Date, select: false },
    role: {
      type: String,
      enum: ['Super Admin', 'Admin', 'Moderator', 'Teacher', 'Student'],
      default: 'Student',
    },
    studentNumber: { type: String, unique: true, sparse: true },
    avatar: String,
    avatarPublicId: { type: String, select: false },
    communityPoints: { type: Number, default: 0, min: 0 },
    isCommunityProfilePrivate: { type: Boolean, default: false },
    activeSubscription: {
      plan: { type: String, trim: true },
      billingDuration: { type: Number, min: 1 },
      billingLabel: { type: String },
      startDate: Date,
      endDate: Date,
    },
    purchasedCourses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
  },
  { timestamps: true }
);

const STUDENT_NUMBER_MIN = 100_000_000;
const STUDENT_NUMBER_SPAN = 900_000_000;
const STUDENT_NUMBER_ATTEMPTS = 10;

/** A random 9-digit number, grouped by three: "482-917-305". */
export const randomStudentNumber = (): string =>
  String(STUDENT_NUMBER_MIN + Math.floor(Math.random() * STUDENT_NUMBER_SPAN)).replace(
    /^(\d{3})(\d{3})(\d{3})$/,
    '$1-$2-$3'
  );

/** A student number no user has yet (the unique index still guards against a race). */
export const uniqueStudentNumber = async (): Promise<string> => {
  for (let attempt = 0; attempt < STUDENT_NUMBER_ATTEMPTS; attempt += 1) {
    const candidate = randomStudentNumber();
    if (!(await User.exists({ studentNumber: candidate }))) return candidate;
  }
  throw new Error('Could not generate a unique student number');
};

// New students get their number when they are first saved
userSchema.pre('save', async function () {
  if (this.role === 'Student' && !this.studentNumber) this.studentNumber = await uniqueStudentNumber();
});

userSchema.index({ createdAt: -1 });
userSchema.index({ role: 1, createdAt: -1 });

export const User = model<IUser>('User', userSchema);
