import type { CourseQuestion } from '@/schemas/people.schema';

export type QuestionFilter = 'unresolved' | 'all' | 'needsStaffAnswer' | 'resolved';

export const QUESTION_FILTERS: readonly QuestionFilter[] = [
  'unresolved',
  'all',
  'needsStaffAnswer',
  'resolved',
];

const matches: Record<QuestionFilter, (question: CourseQuestion) => boolean> = {
  unresolved: (question) => !question.isResolved,
  all: () => true,
  needsStaffAnswer: (question) => !question.hasStaffAnswer,
  resolved: (question) => question.isResolved,
};

export const filterQuestions = (
  questions: CourseQuestion[],
  filter: QuestionFilter,
): CourseQuestion[] => questions.filter(matches[filter]);

export const countQuestions = (questions: CourseQuestion[]): Record<QuestionFilter, number> => ({
  unresolved: filterQuestions(questions, 'unresolved').length,
  all: questions.length,
  needsStaffAnswer: filterQuestions(questions, 'needsStaffAnswer').length,
  resolved: filterQuestions(questions, 'resolved').length,
});

export const needsStaffAnswer = (question: CourseQuestion): boolean =>
  !question.isResolved && !question.hasStaffAnswer;

/** The question's thread in the course player (staff answer and resolve it there). */
export const questionThreadPath = (courseId: string, questionId: string): string =>
  `/admin/courses/${encodeURIComponent(courseId)}/learn?tab=qa&questionId=${encodeURIComponent(questionId)}`;
