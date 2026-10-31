import { z } from 'zod';

// Quiz sections, banks and attempts of a course: GET /api/quiz-sections/course/:id, GET /api/quiz-bank/course/:id
// (the course editor manages them; the course player takes them) and the student's attempts.

export const quizSectionSchema = z.object({
  _id: z.string(),
  title: z.string(),
  order: z.number().catch(0),
  isFreePreview: z.boolean().catch(false),
});
export type QuizSection = z.infer<typeof quizSectionSchema>;

/**
 * A question. Staff and the course's teachers always get `correctOptionIndices` and the explanations; a
 * student only once they answered that question.
 */
export const quizQuestionSchema = z.object({
  _id: z.string(),
  question: z.string(),
  options: z.array(z.object({ text: z.string(), explanation: z.string().nullish() })),
  correctOptionIndices: z.array(z.number()).optional(),
});
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;

export const quizBankSchema = z.object({
  _id: z.string(),
  quizSection: z.string().nullish(),
  title: z.string(),
  description: z.string().nullish(),
  isFreePreview: z.boolean().catch(false),
  questions: z.array(quizQuestionSchema).catch([]),
});
export type QuizBank = z.infer<typeof quizBankSchema>;

export const quizAnswerSchema = z.object({
  questionId: z.string(),
  selectedOptionIndices: z.array(z.number()),
  isCorrect: z.boolean(),
});
export type QuizAnswer = z.infer<typeof quizAnswerSchema>;

/** GET .../my-attempts items and the answer endpoint's response. */
export const quizAttemptSchema = z.object({
  _id: z.string(),
  quizBank: z.string(),
  answers: z.array(quizAnswerSchema).default([]),
});
export type QuizAttempt = z.infer<typeof quizAttemptSchema>;
