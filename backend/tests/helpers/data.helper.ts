import { Types } from 'mongoose';
import { Category } from '../../src/models/Category.model';
import { CourseType } from '../../src/models/CourseType.model';
import { Course } from '../../src/models/Course.model';
import { SubscriptionPlanConfig } from '../../src/models/SubscriptionPlanConfig.model';
import { Teacher } from '../../src/models/Teacher.model';
import type { IUser } from '../../src/models/User.model';

export const makeObjectId = (): string => new Types.ObjectId().toString();

const uniqueSuffix = () => new Types.ObjectId().toString().slice(-6);

export const createCategory = async (name = `Web Development ${uniqueSuffix()}`) =>
  Category.create({
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    description: `${name} courses`,
  });

export const createCourseType = async (name = `Bootcamp ${uniqueSuffix()}`) =>
  CourseType.create({
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    description: `${name} format`,
  });

export const createCoursePrerequisites = async () => {
  const [category, courseType] = await Promise.all([
    createCategory(),
    createCourseType(),
  ]);
  return { category, courseType };
};

export const createCourse = async (
  createdBy: IUser,
  overrides: Record<string, unknown> = {},
) => {
  const { category, courseType } = await createCoursePrerequisites();
  return Course.create({
    title: 'Production Grade Node.js',
    subtitle: 'APIs that hold up',
    description: 'A complete backend API course.',
    category: category._id,
    courseType: courseType._id,
    visibility: 'Public',
    pricing: 'Free',
    price: 0,
    listPrice: 0,
    discountPrice: 0,
    includedInSubscription: false,
    allowedSubscriptionPlans: [],
    status: 'Published',
    createdBy: createdBy._id,
    ...overrides,
  });
};

export const createTeacherProfile = async (
  overrides: Record<string, unknown> = {},
) =>
  Teacher.create({
    name: `Teacher ${uniqueSuffix()}`,
    bio: 'Experienced instructor',
    expertise: ['Node.js', 'Testing'],
    ...overrides,
  });

export const createSubscriptionPlan = async (
  createdBy: IUser,
  overrides: Record<string, unknown> = {},
) =>
  SubscriptionPlanConfig.create({
    plan: 'Premium',
    price: 29,
    duration: 1,
    billingOptions: [{ label: 'Monthly', duration: 1, price: 29 }],
    features: ['All premium courses'],
    isActive: true,
    createdBy: createdBy._id,
    ...overrides,
  });
