export type UserRole = 'Super Admin' | 'Admin' | 'Moderator' | 'Teacher' | 'Student';
export type SubscriptionPlan = 'Basic' | 'Premium' | 'Gold' | 'Quiz Only';
export type CourseVisibility = 'Public' | 'Private';
export type CoursePricing = 'Free' | 'Paid';
export type CourseStatus = 'Draft' | 'Published';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  total?: number;
  page?: number;
  limit?: number;
}
