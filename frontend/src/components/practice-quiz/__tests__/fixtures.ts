import { http } from 'msw';

import { ok } from '@/test/msw/handlers';

import type { PracticeCourse, PracticeTree } from '@/schemas/practice-quiz.schema';
import type { QuizBank } from '@/schemas/quiz.schema';

export const COURSE_A = '64b7f0c2a1b2c3d4e5f6aa01';
export const COURSE_B = '64b7f0c2a1b2c3d4e5f6aa02';

export const makeCourse = (id: string, title: string): PracticeCourse => ({
  _id: id,
  title,
  subtitle: `${title} subtitle`,
  coverImage: null,
  pricing: 'Paid',
  price: 1000,
  listPrice: 1000,
  discountPrice: 800,
  discountPercent: 20,
  includedInSubscription: true,
});

/** A free bank as the public tree sends it: questions and options, never the answers. */
export const makeBank = (id: string, title: string, questionIds: string[]): QuizBank => ({
  _id: id,
  quizSection: 'qs1',
  title,
  description: `${title} description`,
  isFreePreview: false,
  questions: questionIds.map((questionId, index) => ({
    _id: questionId,
    question: `Question ${index + 1} of ${title}?`,
    options: [{ text: 'Newton' }, { text: 'Joule' }, { text: 'Watt' }, { text: 'Pascal' }],
  })),
});

export const makeTree = (
  courseId: string,
  banks: QuizBank[],
  lockedBankCount = 2,
): PracticeTree => ({
  course: makeCourse(courseId, courseId === COURSE_A ? 'Physics' : 'Chemistry'),
  sections: [{ _id: 'qs1', title: 'Chapter 1', isFreePreview: true, banks }],
  lockedBankCount,
  lockedQuestionCount: 10,
});

export const TREES: Record<string, PracticeTree> = {
  [COURSE_A]: makeTree(COURSE_A, [
    makeBank('b1', 'Motion', ['q1', 'q2']),
    makeBank('b2', 'Energy', ['q3']),
  ]),
  [COURSE_B]: makeTree(COURSE_B, [makeBank('b3', 'Atoms', ['q4'])], 0),
};

/** Course list + trees of the two courses. Returns the query strings the course list was asked with. */
export const publicHandlers = (
  courses = [makeCourse(COURSE_A, 'Physics'), makeCourse(COURSE_B, 'Chemistry')],
) => {
  const queries: string[] = [];
  return {
    queries,
    handlers: [
      http.get('*/api/quiz-bank/public/courses', ({ request }) => {
        queries.push(new URL(request.url).search);
        return ok(courses);
      }),
      http.get('*/api/quiz-bank/public/course/:courseId', ({ params }) =>
        ok(TREES[String(params.courseId)]),
      ),
    ],
  };
};
