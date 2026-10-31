import { z } from 'zod';

import { hasVisibleText } from '@/utils/html-text';

import { userRoleSchema } from './auth.schema';

// Course player shapes: what the course-content endpoints really send (announcements, study materials, Q&A, enrolment counts; quizzes: quiz.schema.ts). Populated users whose account was deleted come back as null.

const HTTP_LINK = /^https?:\/\//i;

export const postedBySchema = z.object({
  _id: z.string(),
  name: z.string(),
  avatar: z.string().nullish(),
  role: userRoleSchema.or(z.string()),
});
export type PostedBy = z.infer<typeof postedBySchema>;

const postedByField = postedBySchema.nullish();

/** GET/POST/PUT /api/announcements/... */
export const announcementSchema = z.object({
  _id: z.string(),
  title: z.string(),
  description: z.string().default(''),
  postedBy: postedByField,
  createdAt: z.string(),
});
export type Announcement = z.infer<typeof announcementSchema>;

/** GET/POST/PUT /api/study-materials/... (`fileUrl` is always http(s) on the server) */
export const studyMaterialSchema = announcementSchema.extend({
  fileUrl: z.string().nullish(),
});
export type StudyMaterial = z.infer<typeof studyMaterialSchema>;

/** GET /api/enrollments/course/:courseId/count */
export const enrollmentCountSchema = z.object({ count: z.number() });

// ---- Q&A ----

export const qaQuestionSchema = z.object({
  _id: z.string(),
  title: z.string(),
  description: z.string().default(''),
  postedBy: postedByField,
  upvotes: z.array(z.string()).default([]),
  isResolved: z.boolean().default(false),
  answerCount: z.number().default(0),
  staffAnswerCount: z.number().default(0),
  hasStaffAnswer: z.boolean().default(false),
  createdAt: z.string(),
});
export type QaQuestion = z.infer<typeof qaQuestionSchema>;

export const qaAnswerSchema = z.object({
  _id: z.string(),
  body: z.string(),
  postedBy: postedByField,
  upvotes: z.array(z.string()).default([]),
  createdAt: z.string(),
});
export type QaAnswer = z.infer<typeof qaAnswerSchema>;

/** GET /api/qa/questions/:id */
export const qaQuestionDetailSchema = z.object({
  question: qaQuestionSchema,
  answers: z.array(qaAnswerSchema),
});
export type QaQuestionDetail = z.infer<typeof qaQuestionDetailSchema>;

/** PATCH .../upvote */
export const upvotesSchema = z.object({ upvotes: z.array(z.string()) });

// ---- Form bodies (validation messages are i18n keys) ----

const requiredText = z.string().trim().min(1, 'validation.required');
const requiredRichText = z.string().refine(hasVisibleText, 'validation.required');

/** POST/PUT announcement and question bodies */
export const titledPostRequestSchema = z.object({
  title: requiredText,
  description: requiredRichText,
});
export type TitledPostRequest = z.infer<typeof titledPostRequestSchema>;

/** POST/PUT study material body: the link is optional, but only http(s) (same rule as the backend). */
export const studyMaterialRequestSchema = titledPostRequestSchema.extend({
  fileUrl: z
    .string()
    .trim()
    .refine((value) => value === '' || HTTP_LINK.test(value), 'learn.validation.httpLink'),
});
export type StudyMaterialRequest = z.infer<typeof studyMaterialRequestSchema>;

export const liveClassLectureRequestSchema = z.object({
  title: requiredText,
  day: requiredText,
  time: requiredText,
  description: z.string().trim(),
});
export type LiveClassLectureRequest = z.infer<typeof liveClassLectureRequestSchema>;

/**
 * POST/PUT live class body (the form of the course editor and the course player): every class needs a
 * title, a date and a time.
 */
export const liveClassRequestSchema = z.object({
  title: requiredText,
  weekName: requiredText,
  description: requiredRichText,
  lectures: z.array(liveClassLectureRequestSchema).min(1, 'catalog.validation.oneClass'),
});
export type LiveClassRequest = z.infer<typeof liveClassRequestSchema>;

/** POST/PUT answer body */
export const answerRequestSchema = z.object({ body: requiredRichText });
export type AnswerRequest = z.infer<typeof answerRequestSchema>;
