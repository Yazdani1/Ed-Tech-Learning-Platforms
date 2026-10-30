// Test data for the public-site component tests, checked against the same Zod schemas the app uses.
import { http } from 'msw';

import {
  subscriptionPlanSchema,
  subscriptionSchema,
  taxonomySchema,
  type Subscription,
  type SubscriptionPlan,
  type Taxonomy,
} from '@/schemas/catalog.schema';
import {
  courseCardSchema,
  teacherProfileSchema,
  type CourseCardData,
  type TeacherProfile,
} from '@/schemas/public.schema';
import { ok } from '@/test/msw/handlers';

export const makeCategory = (overrides: Partial<Taxonomy> = {}): Taxonomy =>
  taxonomySchema.parse({ _id: '650000000000000000000001', name: 'Programming', ...overrides });

export const makeCourse = (overrides: Partial<CourseCardData> = {}): CourseCardData =>
  courseCardSchema.parse({
    _id: '660000000000000000000001',
    title: 'TypeScript Basics',
    pricing: 'Paid',
    price: 800,
    listPrice: 1000,
    discountPrice: 800,
    category: { _id: '650000000000000000000001', name: 'Programming' },
    courseType: { _id: '650000000000000000000009', name: 'Recorded' },
    teachers: [{ _id: '670000000000000000000001', name: 'Ada Lovelace' }],
    ...overrides,
  });

export const makeTeacher = (overrides: Partial<TeacherProfile> = {}): TeacherProfile =>
  teacherProfileSchema.parse({
    _id: '670000000000000000000001',
    name: 'Ada Lovelace',
    bio: 'Teaches programming.',
    expertise: ['Math', 'Code'],
    socialLinks: { linkedin: 'https://linkedin.com/in/ada' },
    ...overrides,
  });

export const makePlan = (overrides: Partial<SubscriptionPlan> = {}): SubscriptionPlan =>
  subscriptionPlanSchema.parse({
    _id: '680000000000000000000001',
    plan: 'Premium',
    price: 500,
    duration: 1,
    billingOptions: [
      { label: 'Monthly', duration: 1, price: 500 },
      { label: 'Yearly', duration: 12, price: 4800 },
    ],
    features: ['All recorded courses', 'Quiz bank'],
    badge: 'Popular',
    courseCount: 2,
    ...overrides,
  });

export const makeSubscription = (overrides: Partial<Subscription> = {}): Subscription =>
  subscriptionSchema.parse({
    _id: '690000000000000000000001',
    plan: 'Premium',
    billingDuration: 1,
    endDate: '2099-01-01T00:00:00.000Z',
    status: 'Active',
    ...overrides,
  });

/** The browse envelope with paging, as GET /api/courses/browse?page&limit sends it. */
export const browsePage = (courses: CourseCardData[], page = 1, total = courses.length) =>
  ok(courses, {
    total,
    filterCounts: {},
    pagination: { page, limit: 8, total, totalPages: Math.max(Math.ceil(total / 8), 1) },
  });

/** Every public read the layout and home page make, answering with empty data unless overridden. */
export const publicChromeHandlers = [
  http.get('*/api/home-hero-posts/logo/public', () => ok(null)),
  http.get('*/api/courses/discounts/active', () => ok(null)),
];
