export type UserRole = 'Super Admin' | 'Admin' | 'Moderator' | 'Teacher' | 'Student';
export type SubscriptionPlan = 'Basic' | 'Premium' | 'Gold' | 'Quiz Only';
export type CourseVisibility = 'Public' | 'Private';
export type CoursePricing = 'Free' | 'Paid';
export type CourseStatus = 'Draft' | 'Published';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  activeSubscription?: {
    plan: SubscriptionPlan;
    startDate: string;
    endDate: string;
  };
  purchasedCourses: string[];
  createdAt: string;
}

export interface ITeacher {
  _id: string;
  name: string;
  bio: string;
  profileImage?: string;
  expertise: string[];
  socialLinks?: {
    website?: string;
    linkedin?: string;
    twitter?: string;
    youtube?: string;
  };
}

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface ILecture {
  _id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  order: number;
  isPreview: boolean;
}

export interface ISection {
  _id: string;
  title: string;
  order: number;
  lectures: ILecture[];
}

export interface ICourse {
  _id: string;
  title: string;
  subtitle?: string;
  description: string;
  coverImage?: string;
  category: ICategory;
  teachers: ITeacher[];
  visibility: CourseVisibility;
  pricing: CoursePricing;
  price?: number;
  includedInSubscription: boolean;
  allowedSubscriptionPlans: SubscriptionPlan[];
  status: CourseStatus;
  whatYouWillLearn: string[];
  whatYouWillGet: string[];
  requirements: string[];
  sections: ISection[];
  createdAt: string;
}

export interface ISubscription {
  _id: string;
  user: Pick<IUser, '_id' | 'name' | 'email'>;
  plan: SubscriptionPlan;
  status: 'Active' | 'Expired' | 'Cancelled';
  startDate: string;
  endDate: string;
  assignedBy?: Pick<IUser, '_id' | 'name'>;
}

export interface ISubscriptionPlanConfig {
  _id: string;
  plan: SubscriptionPlan;
  price: number;
  duration: number;
  features: string[];
  badge?: string;
  color?: string;
  isActive: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  total?: number;
}
