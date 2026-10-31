import { z } from 'zod';

import { userRoleSchema } from './auth.schema';
import { postedBySchema } from './learn.schema';

// People administration: users, teacher profiles, subscriptions + plans, and the staff course Q&A list.
// Response schemas match what the backend really sends; form schemas carry i18n keys as messages.

/** Same bounds the backend enforces for a password set by an admin (user.controller). */
export const MANAGED_PASSWORD_MIN = 6;
export const MANAGED_PASSWORD_MAX = 72;

/** The `pagination` block of GET /api/users and GET /api/subscriptions. */
export const paginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

const enrollmentSummarySchema = z.object({
  free: z.number().catch(0),
  paid: z.number().catch(0),
  subscription: z.number().catch(0),
  total: z.number().catch(0),
});

const spendingSummarySchema = z.object({
  paidCourses: z.number().catch(0),
  subscriptions: z.number().catch(0),
  total: z.number().catch(0),
});

/** One user in GET /api/users (summaries only for a Super Admin). */
export const managedUserSchema = z.object({
  _id: z.string(),
  name: z.string(),
  email: z.string(),
  role: userRoleSchema,
  avatar: z.string().nullish(),
  createdAt: z.string().nullish(),
  updatedAt: z.string().nullish(),
  activeSubscription: z
    .object({
      plan: z.string().nullish(),
      startDate: z.string().nullish(),
      endDate: z.string().nullish(),
    })
    .nullish(),
  enrollmentSummary: enrollmentSummarySchema.nullish(),
  spendingSummary: spendingSummarySchema.nullish(),
});
export type ManagedUser = z.infer<typeof managedUserSchema>;

/** GET /api/users envelope: the page, the filtered total, every user and the paging block. */
export const usersEnvelopeSchema = z.object({
  data: z.array(managedUserSchema),
  total: z.number(),
  totalUsers: z.number(),
  pagination: paginationSchema,
});
export type UsersPage = z.infer<typeof usersEnvelopeSchema>;

const nameField = z.string().trim().min(1, 'validation.required');
const emailField = z
  .string()
  .trim()
  .min(1, 'validation.required')
  .pipe(z.email('validation.email'));
const passwordField = z
  .string()
  .min(MANAGED_PASSWORD_MIN, 'people.users.passwordLength')
  .max(MANAGED_PASSWORD_MAX, 'people.users.passwordLength');

/** POST /api/users body. */
export const userCreateSchema = z.object({
  name: nameField,
  email: emailField,
  password: passwordField,
  role: userRoleSchema,
});
export type UserCreateRequest = z.infer<typeof userCreateSchema>;

/** PUT /api/users/:id form: an empty password keeps the current one. */
export const userEditSchema = userCreateSchema.extend({
  password: z.union([z.literal(''), passwordField]),
});
export type UserEditForm = z.infer<typeof userEditSchema>;

const namedSchema = z.object({ _id: z.string(), name: z.string() });

const isJsonObject = (value: string): boolean => {
  if (!value.trim()) return true;
  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed);
  } catch {
    return false;
  }
};

/** Teacher form (sent as multipart: expertise comma separated, social links a JSON object). */
export const teacherFormSchema = z.object({
  name: nameField,
  bio: z.string().trim().min(1, 'validation.required'),
  expertise: z.string(),
  socialLinks: z.string().refine(isJsonObject, 'people.teachers.socialLinksInvalid'),
  userId: z.string(),
});
export type TeacherForm = z.infer<typeof teacherFormSchema>;

export const subscriptionStatusSchema = z.enum(['Active', 'Expired', 'Cancelled']);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

/** One record in GET /api/subscriptions (user and assigner populated; null when deleted). */
export const subscriptionRecordSchema = z.object({
  _id: z.string(),
  user: z.object({ _id: z.string(), name: z.string(), email: z.string() }).nullish(),
  plan: z.string(),
  billingDuration: z.number().nullish(),
  billingLabel: z.string().nullish(),
  pricePaid: z.number().nullish(),
  status: subscriptionStatusSchema,
  startDate: z.string(),
  endDate: z.string(),
  assignedBy: namedSchema.nullish(),
});
export type SubscriptionRecord = z.infer<typeof subscriptionRecordSchema>;

export const memberStatusSchema = z.enum(['active', 'cancelled', 'expired', 'all']);
export type MemberStatus = z.infer<typeof memberStatusSchema>;

/** GET /api/subscriptions envelope (status counts follow the other filters). */
export const subscriptionsEnvelopeSchema = z.object({
  data: z.array(subscriptionRecordSchema),
  total: z.number(),
  pagination: paginationSchema,
  statusCounts: z.record(memberStatusSchema, z.number()),
});
export type SubscriptionsPage = z.infer<typeof subscriptionsEnvelopeSchema>;

/** Assign form: everything required; the end date (yyyy-mm-dd) must be after today. */
export const assignFormSchema = z.object({
  userId: z.string().min(1, 'validation.required'),
  plan: z.string().min(1, 'validation.required'),
  billingDuration: z.string().min(1, 'validation.required'),
  endDate: z.string().min(1, 'validation.required'),
});
export type AssignForm = z.infer<typeof assignFormSchema>;

/** POST /api/subscriptions/assign body. */
export interface AssignRequest {
  userId: string;
  plan: string;
  billingDuration: number;
  endDate: string;
}

/** Months: a whole number of 1 or more (same rule as the backend). */
const monthsField = z
  .string()
  .trim()
  .min(1, 'validation.required')
  .refine((value) => Number.isInteger(Number(value)) && Number(value) >= 1, {
    message: 'people.plans.durationInvalid',
  });

/** Price: any number of 0 or more. */
const priceField = z
  .string()
  .trim()
  .min(1, 'validation.required')
  .refine((value) => Number.isFinite(Number(value)) && Number(value) >= 0, {
    message: 'people.plans.priceInvalid',
  });

/** Plan form: a name, at least one billing option, optional badge/colour, features. */
export const planFormSchema = z.object({
  plan: nameField,
  billingOptions: z
    .array(
      z.object({
        label: z.string().trim().min(1, 'validation.required'),
        duration: monthsField,
        price: priceField,
      }),
    )
    .min(1, 'people.plans.optionRequired'),
  badge: z.string(),
  color: z.string(),
  features: z.array(z.object({ value: z.string() })),
});
export type PlanForm = z.infer<typeof planFormSchema>;

/** POST /api/subscription-plans body (create or update by name). */
export interface PlanRequest {
  plan: string;
  billingOptions: { label: string; duration: number; price: number }[];
  features: string[];
  badge?: string;
  color?: string;
}

/** A question in the staff Q&A list (with answer counts). */
export const courseQuestionSchema = z.object({
  _id: z.string(),
  title: z.string(),
  description: z.string().catch(''),
  postedBy: postedBySchema.nullish(),
  isResolved: z.boolean().catch(false),
  answerCount: z.number().catch(0),
  hasStaffAnswer: z.boolean().catch(false),
  createdAt: z.string().nullish(),
});
export type CourseQuestion = z.infer<typeof courseQuestionSchema>;

/** One group of GET /api/qa/admin/course-questions (unresolved questions of one course). */
export const courseQuestionGroupSchema = z.object({
  course: z.object({ _id: z.string(), title: z.string(), subtitle: z.string().nullish() }),
  questions: z.array(courseQuestionSchema),
});
export type CourseQuestionGroup = z.infer<typeof courseQuestionGroupSchema>;
