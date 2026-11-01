import { z } from 'zod';

import { coursePricingSchema } from './browse.schema';
import { quizBankSchema } from './quiz.schema';

// Public practice quiz (/practice-quiz): what the public quiz-bank endpoints really send. Signed-in answers,
// attempts and the revealed answers use quiz.schema.ts (shared with the course player).

/** A course of GET /api/quiz-bank/public/courses, and `course` of the public tree (same fields). */
export const practiceCourseSchema = z.object({
  _id: z.string(),
  title: z.string(),
  subtitle: z.string().nullish(),
  coverImage: z.string().nullish(),
  pricing: coursePricingSchema,
  price: z.number().nullish(),
  listPrice: z.number().nullish(),
  discountPrice: z.number().nullish(),
  discountPercent: z.number().nullish(),
  includedInSubscription: z.boolean().catch(false),
});
export type PracticeCourse = z.infer<typeof practiceCourseSchema>;

/** A free-preview quiz section with its free banks (questions and options, never the answers). */
export const practiceSectionSchema = z.object({
  _id: z.string(),
  title: z.string(),
  isFreePreview: z.boolean().catch(false),
  banks: z.array(quizBankSchema).catch([]),
});
export type PracticeSection = z.infer<typeof practiceSectionSchema>;
/** The course page lists the same sections (only titles and the free-preview flag are shown). */
export type PublicQuizSection = PracticeSection;

/** GET /api/quiz-bank/public/course/:courseId */
export const practiceTreeSchema = z.object({
  course: practiceCourseSchema,
  sections: z.array(practiceSectionSchema).catch([]),
  lockedBankCount: z.number().catch(0),
  lockedQuestionCount: z.number().catch(0),
});
export type PracticeTree = z.infer<typeof practiceTreeSchema>;

/** POST /api/quiz-bank/public/:id/questions/:qId/check (guests; nothing is stored). */
export const practiceCheckResultSchema = z.object({
  isCorrect: z.boolean(),
  correctOptionIndices: z.array(z.number()),
  /** Each option's explanation in order, null when there is none */
  explanations: z.array(z.string().nullable()),
});
export type PracticeCheckResult = z.infer<typeof practiceCheckResultSchema>;

/** Filters of the course list (empty = no filter); sent as the endpoint's query parameters. */
export interface PracticeCourseFilters {
  search: string;
  categories: string;
  courseTypes: string;
  pricing: '' | 'Free' | 'Paid';
}
