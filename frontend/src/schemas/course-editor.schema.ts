import { z } from 'zod';

import { isSafeHttpUrl } from '@/utils/urls';

import { coursePricingSchema, courseStatusSchema, courseVisibilitySchema } from './browse.schema';

// Course editor (Super Admin, Admin): save responses and the form schemas of the course details, curriculum,
// live classes and quiz banks. The course itself is read with browse.api getCourse (courseSchema). Form
// schemas carry i18n keys as messages (shown through useFieldError).

/** POST/PUT /api/courses and PATCH /:id/status answer the saved course (refs not populated). */
export const savedCourseSchema = z.object({
  _id: z.string(),
  coverImage: z.string().nullish(),
  status: courseStatusSchema.catch('Draft'),
  publishedAt: z.string().nullish(),
  firstPublishedAt: z.string().nullish(),
});
export type SavedCourse = z.infer<typeof savedCourseSchema>;

/** POST .../sections and POST .../lectures answer the new item. */
export const createdItemSchema = z.object({ _id: z.string() });

// ---- Course details form ----

const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;

const BATCH_PATTERN = /^(\d{4})?$/;
const CODE_PATTERN = /^([A-Za-z0-9-]{6,20})?$/;
const SCHEDULE_MAX = 200;

const scheduleField = z.string().trim().max(SCHEDULE_MAX, 'catalog.validation.scheduleLong');

const priceField = z
  .string()
  .trim()
  .refine((value) => value === '' || PRICE_PATTERN.test(value), 'catalog.validation.price');

export const courseDetailsFormSchema = z
  .object({
    title: z.string().trim().max(200, 'catalog.validation.titleLong'),
    subtitle: z.string(),
    category: z.string(),
    courseType: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    teachers: z.array(z.string()),
    /** 4 digits, unique (the server checks); a new course gets a suggestion */
    batchNumber: z.string().trim().regex(BATCH_PATTERN, 'catalog.validation.batchNumber'),
    liveClassSchedule: scheduleField,
    supportClassSchedule: scheduleField,
    visibility: courseVisibilitySchema,
    pricing: coursePricingSchema,
    listPrice: priceField,
    discountPrice: priceField,
    /** The discount works as the course's auto coupon: its code (suggested when empty), start and end */
    discountCode: z.string().trim().regex(CODE_PATTERN, 'coupons.validation.code'),
    discountStartsAt: z.string(),
    discountEndsAt: z.string(),
    includedInSubscription: z.boolean(),
    allowedSubscriptionPlans: z.array(z.string()),
    description: z.string(),
    whatYouWillLearn: z.array(z.string()),
    whatYouWillGet: z.array(z.string()),
    requirements: z.array(z.string()),
  })
  .superRefine((values, ctx) => {
    if (values.startDate && values.endDate && values.endDate < values.startDate)
      ctx.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'catalog.validation.endBeforeStart',
      });
    if (values.pricing !== 'Paid') return;
    if (
      values.discountStartsAt &&
      values.discountEndsAt &&
      new Date(values.discountEndsAt) <= new Date(values.discountStartsAt)
    )
      ctx.addIssue({
        code: 'custom',
        path: ['discountEndsAt'],
        message: 'coupons.validation.endAfterStart',
      });
    if (values.listPrice === '')
      ctx.addIssue({ code: 'custom', path: ['listPrice'], message: 'validation.required' });
    else if (values.discountPrice !== '' && Number(values.discountPrice) > Number(values.listPrice))
      ctx.addIssue({
        code: 'custom',
        path: ['discountPrice'],
        message: 'catalog.validation.discountAboveList',
      });
  });
export type CourseDetailsForm = z.infer<typeof courseDetailsFormSchema>;

export const EMPTY_COURSE_DETAILS: CourseDetailsForm = {
  title: '',
  subtitle: '',
  category: '',
  courseType: '',
  startDate: '',
  endDate: '',
  teachers: [],
  batchNumber: '',
  liveClassSchedule: '',
  supportClassSchedule: '',
  visibility: 'Private',
  pricing: 'Free',
  listPrice: '',
  discountPrice: '',
  discountCode: '',
  discountStartsAt: '',
  discountEndsAt: '',
  includedInSubscription: false,
  allowedSubscriptionPlans: [],
  description: '',
  whatYouWillLearn: [],
  whatYouWillGet: [],
  requirements: [],
};

// ---- Curriculum forms ----

const optionalVideoUrl = z
  .string()
  .trim()
  .refine((value) => value === '' || isSafeHttpUrl(value), 'catalog.validation.url');

export const lectureFormSchema = z.object({
  title: z.string().trim().min(1, 'validation.required'),
  videoUrl: optionalVideoUrl,
  isPreview: z.boolean(),
});
export type LectureForm = z.infer<typeof lectureFormSchema>;

export const titleFormSchema = z.object({
  title: z.string().trim().min(1, 'validation.required'),
});
export type TitleForm = z.infer<typeof titleFormSchema>;

// ---- Quiz bank forms (response shapes: quiz.schema.ts) ----

export const OPTION_COUNT = 4;
export const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

export const bankFormSchema = z.object({
  title: z.string().trim().min(1, 'validation.required'),
  description: z.string().trim(),
});
export type BankForm = z.infer<typeof bankFormSchema>;

export const questionFormSchema = z.object({
  question: z.string().trim().min(1, 'validation.required'),
  options: z
    .array(
      z.object({
        text: z.string().trim().min(1, 'validation.required'),
        explanation: z.string().trim(),
      }),
    )
    .length(OPTION_COUNT),
  correctOptionIndices: z.array(z.number()).min(1, 'catalog.quiz.pickCorrect'),
});
export type QuestionForm = z.infer<typeof questionFormSchema>;

export const emptyQuestionForm = (): QuestionForm => ({
  question: '',
  options: Array.from({ length: OPTION_COUNT }, () => ({ text: '', explanation: '' })),
  correctOptionIndices: [],
});
