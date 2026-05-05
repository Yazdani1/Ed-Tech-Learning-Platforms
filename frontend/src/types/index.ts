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
  updatedAt?: string;
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
  userId?: string;
}

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface ICourseType {
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
  duration?: number; // seconds
  order: number;
  isPreview: boolean;
}

export interface ISection {
  _id: string;
  title: string;
  order: number;
  lectures: ILecture[];
}

export type EnrollmentType = 'free' | 'paid' | 'subscription';

export interface ICourse {
  _id: string;
  title: string;
  subtitle?: string;
  description: string;
  coverImage?: string;
  category: ICategory;
  courseType?: ICourseType;
  startDate?: string;
  endDate?: string;
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
  enrollmentType?: EnrollmentType;
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
  courseCount: number;
}

export type DateRange = '7d' | '30d' | 'lifetime';

export interface IPerformanceData {
  thisMonthRevenue: number;
  totalRevenue: number;
  thisMonthCount: number;
  totalEnrollments: number;
  chartData: Array<{ date: string; revenue: number; enrollments: number }>;
  breakdown: { free: number; paid: number; subscription: number };
}

export interface IEnrollment {
  _id: string;
  student: Pick<IUser, '_id' | 'name' | 'email' | 'avatar'>;
  course: Pick<ICourse, '_id' | 'title' | 'price' | 'pricing'>;
  enrollmentType: EnrollmentType;
  createdAt: string;
  updatedAt: string;
}

export interface IEnrollmentStats {
  total: number;
  free: number;
  paid: number;
  subscription: number;
  thisMonthCount: number;
  thisMonthEarned: number;
}

export interface IStudyMaterial {
  _id: string;
  course: string;
  title: string;
  description: string;
  fileUrl?: string;
  postedBy: {
    _id: string;
    name: string;
    avatar?: string;
    role: UserRole;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IAnnouncement {
  _id: string;
  course: string;
  title: string;
  description: string;
  postedBy: {
    _id: string;
    name: string;
    avatar?: string;
    role: UserRole;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IStudyCurriculumLecture {
  _id?: string;
  title: string;
  description?: string;
  day: string;
  time: string;
}

export interface IStudyCurriculum {
  _id: string;
  course: string;
  title: string;
  description: string;
  weekName: string;
  lectures: IStudyCurriculumLecture[];
  postedBy: {
    _id: string;
    name: string;
    avatar?: string;
    role: UserRole;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IQuestion {
  _id: string;
  course: string;
  title: string;
  description: string;
  postedBy: {
    _id: string;
    name: string;
    avatar?: string;
    role: UserRole;
  };
  upvotes: string[];
  isResolved: boolean;
  resolvedBy?: {
    _id: string;
    name: string;
    avatar?: string;
    role: UserRole;
  };
  resolvedAt?: string;
  answerCount: number;
  staffAnswerCount: number;
  hasStaffAnswer: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IAnswer {
  _id: string;
  question: string;
  body: string;
  postedBy: {
    _id: string;
    name: string;
    avatar?: string;
    role: UserRole;
  };
  upvotes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ICourseQuestionGroup {
  course: {
    _id: string;
    title: string;
    subtitle?: string;
    status?: CourseStatus;
    coverImage?: string;
  };
  questions: IQuestion[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  total?: number;
  pagination?: IPaginationMeta;
}

export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
