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
});
export type SavedCourse = z.infer<typeof savedCourseSchema>;

/** POST .../sections and POST .../lectures answer the new item. */
export const createdItemSchema = z.object({ _id: z.string() });

/** Cover images the backend accepts (it checks the file content too): PNG/JPEG/GIF/WEBP up to 5 MB. */
export const COVER_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'] as const;
export const COVER_MAX_MB = 5;
const BYTES_PER_MB = 1024 * 1024;
export const COVER_MAX_BYTES = COVER_MAX_MB * BYTES_PER_MB;

// ---- Course details form ----

const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;

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
    visibility: courseVisibilitySchema,
    pricing: coursePricingSchema,
    listPrice: priceField,
    discountPrice: priceField,
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
  visibility: 'Private',
  pricing: 'Free',
  listPrice: '',
  discountPrice: '',
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
