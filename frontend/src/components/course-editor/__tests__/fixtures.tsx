// Test data and handlers shared by the course editor tests (shapes checked by the app's own schemas).
import { http } from 'msw';

import { liveClassWeekSchema, type LiveClassWeek } from '@/schemas/browse.schema';
import { taxonomySchema } from '@/schemas/catalog.schema';
import { ok } from '@/test/msw/handlers';

import {
  quizBankSchema,
  quizSectionSchema,
  type QuizBank,
  type QuizSection,
} from '@/schemas/quiz.schema';
import { courseSchema, type Course } from '@/schemas/browse.schema';

export const COURSE_ID = '64b7f0c2a1b2c3d4e5f6c001';
export const CATEGORY = taxonomySchema.parse({
  _id: '64b7f0c2a1b2c3d4e5f6d001',
  name: 'Maths',
  slug: 'maths',
});
export const COURSE_TYPE = taxonomySchema.parse({
  _id: '64b7f0c2a1b2c3d4e5f6d002',
  name: 'Live',
  slug: 'live',
});
export const TEACHER = { _id: '64b7f0c2a1b2c3d4e5f6d003', name: 'Ms Rahman', bio: 'Teaches maths' };

export const makeCourse = (overrides: Partial<Course> = {}): Course =>
  courseSchema.parse({
    _id: COURSE_ID,
    title: 'Algebra 101',
    subtitle: 'From zero',
    description: '<p>All about algebra</p>',
    category: { _id: CATEGORY._id, name: CATEGORY.name },
    courseType: { _id: COURSE_TYPE._id, name: COURSE_TYPE.name },
    teachers: [{ _id: TEACHER._id, name: TEACHER.name }],
    visibility: 'Public',
    pricing: 'Free',
    status: 'Draft',
    whatYouWillLearn: ['Equations'],
    sections: [
      {
        _id: '64b7f0c2a1b2c3d4e5f6e001',
        title: 'Introduction',
        lectures: [
          {
            _id: '64b7f0c2a1b2c3d4e5f6f001',
            title: 'Welcome',
            isPreview: true,
            videoUrl: 'https://youtu.be/a',
          },
          { _id: '64b7f0c2a1b2c3d4e5f6f002', title: 'Numbers', isPreview: false },
        ],
      },
      { _id: '64b7f0c2a1b2c3d4e5f6e002', title: 'Equations', lectures: [] },
    ],
    ...overrides,
  });

export const makeWeek = (overrides: Partial<LiveClassWeek> = {}): LiveClassWeek =>
  liveClassWeekSchema.parse({
    _id: '64b7f0c2a1b2c3d4e5f6a101',
    title: 'Kick-off week',
    weekName: 'Week 1',
    description: '<p>We start</p>',
    lectures: [
      {
        _id: '64b7f0c2a1b2c3d4e5f6a102',
        title: 'Intro class',
        day: '2026-11-02',
        time: '10:00',
        description: '',
      },
    ],
    ...overrides,
  });

export const SECTION: QuizSection = quizSectionSchema.parse({
  _id: '64b7f0c2a1b2c3d4e5f6b001',
  title: 'Chapter 1',
  order: 0,
  isFreePreview: false,
});

export const BANK: QuizBank = quizBankSchema.parse({
  _id: '64b7f0c2a1b2c3d4e5f6b002',
  quizSection: SECTION._id,
  title: 'Basics quiz',
  description: 'Warm up',
  isFreePreview: false,
  questions: [
    {
      _id: '64b7f0c2a1b2c3d4e5f6b003',
      question: 'What is 2 + 2?',
      options: [
        { text: '3' },
        { text: '4', explanation: 'Two plus two' },
        { text: '5' },
        { text: '22' },
      ],
      correctOptionIndices: [1],
    },
  ],
});

/** The catalog reads the details form needs. */
export const catalogHandlers = [
  http.get('*/api/categories', () => ok([CATEGORY])),
  http.get('*/api/course-types', () => ok([COURSE_TYPE])),
  http.get('*/api/teachers', () => ok([TEACHER])),
  http.get('*/api/subscription-plans', () =>
    ok([
      {
        _id: '64b7f0c2a1b2c3d4e5f6d009',
        plan: 'Gold',
        price: 500,
        duration: 1,
        billingOptions: [],
        features: [],
      },
    ]),
  ),
];
