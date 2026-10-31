import { http } from 'msw';

import { courseSchema, type Course } from '@/schemas/browse.schema';
import {
  announcementSchema,
  qaQuestionSchema,
  type Announcement,
  type PostedBy,
  type QaQuestion,
} from '@/schemas/learn.schema';
import { fail, makeUser, ok } from '@/test/msw/handlers';

import type { UserRole } from '@/types';
import { quizBankSchema, type QuizBank } from '@/schemas/quiz.schema';

export const COURSE_ID = '64b7f0c2a1b2c3d4e5f6c001';

export const posterOf = (role: UserRole): PostedBy => {
  const user = makeUser(role);
  return { _id: user._id, name: user.name, role };
};

export const makeCourse = (overrides: Record<string, unknown> = {}): Course =>
  courseSchema.parse({
    _id: COURSE_ID,
    title: 'Physics 101',
    pricing: 'Free',
    teachers: [{ _id: 't1', name: 'Dr. Rahman', expertise: ['Physics'] }],
    sections: [
      {
        _id: 's1',
        title: 'Getting started',
        lectures: [
          { _id: 'l1', title: 'Welcome', videoUrl: 'https://youtu.be/abcdefghijk', duration: 125 },
          { _id: 'l2', title: 'Locked lecture' },
        ],
      },
    ],
    ...overrides,
  });

export const makeAnnouncement = (overrides: Record<string, unknown> = {}): Announcement =>
  announcementSchema.parse({
    _id: 'a1',
    title: 'Exam on Friday',
    description: '<p>Bring a pencil</p>',
    postedBy: posterOf('Teacher'),
    createdAt: '2026-10-01T10:00:00.000Z',
    ...overrides,
  });

export const makeQuestion = (overrides: Record<string, unknown> = {}): QaQuestion =>
  qaQuestionSchema.parse({
    _id: 'q1',
    title: 'What is inertia?',
    description: '<p>Please explain</p>',
    postedBy: posterOf('Student'),
    upvotes: [],
    isResolved: false,
    answerCount: 0,
    staffAnswerCount: 0,
    hasStaffAnswer: false,
    createdAt: '2026-10-02T10:00:00.000Z',
    ...overrides,
  });

export const makeBank = (overrides: Record<string, unknown> = {}): QuizBank =>
  quizBankSchema.parse({
    _id: 'b1',
    quizSection: 'qs1',
    title: 'Motion basics',
    questions: [
      {
        _id: 'qq1',
        question: 'Unit of force?',
        options: [{ text: 'Newton' }, { text: 'Joule' }, { text: 'Watt' }, { text: 'Pascal' }],
      },
      {
        _id: 'qq2',
        question: 'Unit of energy?',
        options: [{ text: 'Newton' }, { text: 'Joule' }, { text: 'Watt' }, { text: 'Pascal' }],
      },
    ],
    ...overrides,
  });

const base = (path: string): string => `*/api/${path}`;

/** Every course-content list the player may read, with sensible defaults. */
export const contentHandlers = ({
  course = makeCourse(),
  announcements = [makeAnnouncement()],
  questions = [] as QaQuestion[],
}: { course?: Course; announcements?: Announcement[]; questions?: QaQuestion[] } = {}) => [
  http.get(base(`courses/${COURSE_ID}`), () => ok(course)),
  http.get(base(`announcements/course/${COURSE_ID}`), () => ok(announcements)),
  http.get(base(`study-materials/course/${COURSE_ID}`), () => ok([])),
  http.get(base(`study-curricula/course/${COURSE_ID}`), () => ok([])),
  http.get(base(`qa/questions/course/${COURSE_ID}`), () => ok(questions)),
  http.get(base(`enrollments/course/${COURSE_ID}/count`), () => ok({ count: 12 })),
  http.get(base(`enrollments/course/${COURSE_ID}/students`), () => ok([])),
];

export const noAccessHandler = http.get(base(`announcements/course/${COURSE_ID}`), () =>
  fail(403, 'You do not have access to this course'),
);
