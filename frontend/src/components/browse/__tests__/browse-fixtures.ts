// Test data for the catalog component tests, checked against the same Zod schemas the app uses.
import { http } from 'msw';

import { courseSchema, type Course } from '@/schemas/browse.schema';
import { subscriptionPlanSchema, taxonomySchema, type Taxonomy } from '@/schemas/catalog.schema';
import { ok } from '@/test/msw/handlers';

let nextId = 0;
/** A 24-hex id like MongoDB's. */
export const objectId = (): string => {
  nextId += 1;
  return nextId.toString(16).padStart(24, '0');
};

export const CATEGORY = taxonomySchema.parse({
  _id: 'c00000000000000000000001',
  name: 'Programming',
});
export const COURSE_TYPE = taxonomySchema.parse({
  _id: 't00000000000000000000001',
  name: 'Skill Course',
  description: 'Short practical courses',
});

/** A Published + Public course as the backend sends it (overrides win). */
export const makeCourse = (overrides: Record<string, unknown> = {}): Course =>
  courseSchema.parse({
    _id: objectId(),
    title: 'Intro to TypeScript',
    description: '<p>Learn <strong>types</strong></p>',
    category: { _id: CATEGORY._id, name: CATEGORY.name },
    courseType: {
      _id: COURSE_TYPE._id,
      name: COURSE_TYPE.name,
      description: COURSE_TYPE.description,
    },
    teachers: [{ _id: objectId(), name: 'Rahim Uddin', expertise: ['TypeScript'] }],
    status: 'Published',
    pricing: 'Free',
    price: 0,
    includedInSubscription: false,
    allowedSubscriptionPlans: [],
    whatYouWillLearn: ['Types', 'Generics'],
    requirements: ['A computer'],
    sections: [],
    ...overrides,
  });

export const PLANS = [
  subscriptionPlanSchema.parse({
    _id: objectId(),
    plan: 'Basic',
    price: 300,
    duration: 1,
    courseCount: 4,
  }),
  subscriptionPlanSchema.parse({
    _id: objectId(),
    plan: 'Premium',
    price: 600,
    duration: 1,
    courseCount: 9,
  }),
];

export const emptyCounts = { courseTypes: {}, categories: {}, pricing: {}, subscriptionPlans: {} };

/** The public lists every catalog page reads (categories, course types, plans). */
export const catalogListHandlers = (
  categories: Taxonomy[] = [CATEGORY],
  types: Taxonomy[] = [COURSE_TYPE],
) => [
  http.get('*/api/categories', () => ok(categories)),
  http.get('*/api/course-types', () => ok(types)),
  http.get('*/api/subscription-plans', () => ok(PLANS)),
];
