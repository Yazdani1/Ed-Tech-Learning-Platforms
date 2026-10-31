// Pure Q&A helpers (filters and counts), easy to unit test.
import type { QaQuestion } from '@/schemas/learn.schema';

export const QUESTION_FILTERS = ['unresolved', 'all', 'needsStaffAnswer', 'resolved'] as const;
export type QuestionFilter = (typeof QUESTION_FILTERS)[number];

/** Open questions no teacher or staff member has answered yet are highlighted. */
export const needsStaffAnswer = (question: QaQuestion): boolean =>
  !question.isResolved && !question.hasStaffAnswer;

const MATCHES: Record<QuestionFilter, (question: QaQuestion) => boolean> = {
  all: () => true,
  unresolved: (question) => !question.isResolved,
  resolved: (question) => question.isResolved,
  needsStaffAnswer: (question) => !question.hasStaffAnswer,
};

export const filterQuestions = (questions: QaQuestion[], filter: QuestionFilter): QaQuestion[] =>
  questions.filter(MATCHES[filter]);

export const countByFilter = (questions: QaQuestion[]): Record<QuestionFilter, number> => ({
  all: questions.length,
  unresolved: questions.filter(MATCHES.unresolved).length,
  needsStaffAnswer: questions.filter(MATCHES.needsStaffAnswer).length,
  resolved: questions.filter(MATCHES.resolved).length,
});
