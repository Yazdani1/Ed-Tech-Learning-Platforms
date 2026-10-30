import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import app from '../../src/app';
import { Enrollment } from '../../src/models/Enrollment.model';
import { Question } from '../../src/models/Question.model';
import { Subscription } from '../../src/models/Subscription.model';
import { SubscriptionPlanConfig } from '../../src/models/SubscriptionPlanConfig.model';
import {
  authCookie,
  bearer,
  createCategory,
  createCourse,
  createCourseType,
  createTeacherProfile,
  createUser,
  createUsersForAllRoles,
  ROLES,
} from '../factories';
import { dayKey, daysAgo, daysFromNow } from '../factories/admin-messaging';

import type { ICourse } from '../../src/models/Course.model';
import type { IUser } from '../../src/models/User.model';
import type { UserRole } from '../../src/types/index';

type Row = { label: string; value: number };
type TimelineRow = {
  date: string;
  enrollments: number;
  courseRevenue: number;
  subscriptionRevenue: number;
  totalRevenue: number;
};

const URL = '/api/dashboard/summary';
const TIMELINE_DAYS = 30;
const MAX_LIST = 6;

let users: Record<UserRole, IUser>;
let students: IUser[];
let free: ICourse;
let paid: ICourse;
let draft: ICourse;

beforeAll(async () => {
  users = await createUsersForAllRoles();
  students = [users.Student, await createUser('Student'), await createUser('Student')];
  const category = await createCategory();
  const courseType = await createCourseType();
  const base = { category: category._id, courseType: courseType._id, createdBy: users.Admin._id };
  free = await createCourse({ ...base, status: 'Published', pricing: 'Free' });
  paid = await createCourse({ ...base, status: 'Published', pricing: 'Paid', price: 200 });
  draft = await createCourse({ ...base, status: 'Draft', pricing: 'Paid', price: 50 });
  await createTeacherProfile(users.Teacher);

  await Enrollment.create({ student: students[0]._id, course: free._id, enrollmentType: 'free' });
  await Enrollment.create({
    student: students[0]._id,
    course: paid._id,
    enrollmentType: 'paid',
    paidPrice: 150,
  });
  // paidPrice 0: revenue falls back to the course price (200)
  await Enrollment.create({
    student: students[1]._id,
    course: paid._id,
    enrollmentType: 'paid',
    paidPrice: 0,
  });
  await Enrollment.create({ student: students[2]._id, course: paid._id, enrollmentType: 'free' });
  // 60 days old: counts in the totals, not in "this month"
  await Enrollment.create({
    student: students[1]._id,
    course: free._id,
    enrollmentType: 'paid',
    paidPrice: 40,
    createdAt: daysAgo(60),
  });

  await SubscriptionPlanConfig.create({
    plan: 'Premium',
    price: 100,
    duration: 1,
    createdBy: users.Admin._id,
  });
  await Subscription.create({
    user: students[0]._id,
    plan: 'Premium',
    pricePaid: 80,
    status: 'Active',
    startDate: new Date(),
    endDate: daysFromNow(30),
    assignedBy: users.Admin._id,
  });
  await Subscription.create({
    user: students[1]._id,
    plan: 'Premium',
    pricePaid: 60,
    status: 'Expired',
    startDate: daysAgo(60),
    endDate: daysAgo(10),
    assignedBy: users.Admin._id,
    createdAt: daysAgo(60),
  });

  const question = { course: free._id, title: 'Q', description: 'D', postedBy: students[0]._id };
  await Question.create({ ...question });
  await Question.create({ ...question });
  await Question.create({ ...question, isResolved: true });
});

const getSummary = async () => {
  const res = await request(app).get(URL).set('Cookie', authCookie(users['Super Admin']));
  expect(res.status).toBe(200);
  return res.body.data;
};

describe('GET /api/dashboard/summary: access', () => {
  it('401 without a token', async () => {
    const res = await request(app).get(URL);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it.each(ROLES.filter((role) => role !== 'Super Admin'))('403 for %s', async (role) => {
    const res = await request(app).get(URL).set('Cookie', authCookie(users[role]));
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('200 for the Super Admin with the Bearer header', async () => {
    const res = await request(app).get(URL).set('Authorization', bearer(users['Super Admin']));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/dashboard/summary: numbers', () => {
  it('counts users, courses, enrollments, subscriptions and open questions', async () => {
    const { totals } = await getSummary();
    expect(totals).toMatchObject({
      users: 7,
      students: 3,
      teachers: 1,
      courses: 3,
      publishedCourses: 2,
      draftCourses: 1,
      categories: 1,
      enrollments: 5,
      thisMonthEnrollments: 4,
      activeSubscriptions: 1,
      openQuestions: 2,
    });
  });

  it('adds course revenue (paidPrice, else course price) and subscription revenue (pricePaid)', async () => {
    const { totals } = await getSummary();
    expect(totals.courseRevenue).toBe(150 + 200 + 40);
    expect(totals.subscriptionRevenue).toBe(80 + 60);
    expect(totals.totalRevenue).toBe(390 + 140);
  });

  it('this-month revenue uses the same prices as the totals (pricePaid 80, not the plan price 100)', async () => {
    const { totals } = await getSummary();
    expect(totals.thisMonthRevenue).toBe(150 + 200 + 80);
  });

  it('groups users by role, courses by status and by pricing', async () => {
    const data = await getSummary();
    const toMap = (rows: Row[]) => Object.fromEntries(rows.map((row) => [row.label, row.value]));
    expect(toMap(data.roleCounts)).toEqual({
      'Super Admin': 1,
      Admin: 1,
      Moderator: 1,
      Teacher: 1,
      Student: 3,
    });
    expect(toMap(data.courseStatusCounts)).toEqual({ Published: 2, Draft: 1 });
    expect(toMap(data.coursePricingCounts)).toEqual({ Free: 1, Paid: 2 });
  });

  it('lists the top courses by enrollments, best first, with the course summary', async () => {
    const { topCourses } = await getSummary();
    expect(topCourses).toHaveLength(2);
    expect(topCourses[0].enrollments).toBe(3);
    expect(topCourses[0].course._id).toBe(String(paid._id));
    expect(topCourses[1].enrollments).toBe(2);
    expect(topCourses[1].course._id).toBe(String(free._id));
    expect(topCourses.map((item: { course: { _id: string } }) => item.course._id)).not.toContain(
      String(draft._id),
    );
  });

  it('returns recent enrollments (newest first, populated, no password) and at most 6 recent users', async () => {
    const { recentEnrollments, recentUsers } = await getSummary();
    expect(recentEnrollments).toHaveLength(5);
    const dates = recentEnrollments.map((e: { createdAt: string }) => Date.parse(e.createdAt));
    expect([...dates].sort((a, b) => b - a)).toEqual(dates);
    expect(recentEnrollments[0].student).toHaveProperty('name');
    expect(recentEnrollments[0].student).not.toHaveProperty('password');
    expect(recentEnrollments[0].course).toHaveProperty('title');
    expect(recentUsers).toHaveLength(MAX_LIST);
    for (const user of recentUsers) {
      expect(user).not.toHaveProperty('password');
      expect(Object.keys(user).sort()).toEqual(['_id', 'createdAt', 'email', 'name', 'role']);
    }
  });

  it('builds a 30-day timeline ending today with paid-enrollment revenue per day', async () => {
    const { revenueTimeline } = await getSummary();
    const timeline = revenueTimeline as TimelineRow[];
    expect(timeline).toHaveLength(TIMELINE_DAYS);
    expect(timeline[timeline.length - 1].date).toBe(dayKey(new Date()));
    const courseRevenue = timeline.reduce((sum, row) => sum + row.courseRevenue, 0);
    expect(courseRevenue).toBe(150 + 200);
    expect(timeline.reduce((sum, row) => sum + row.enrollments, 0)).toBe(2);
    for (const row of timeline) {
      expect(row.totalRevenue).toBe(row.courseRevenue + row.subscriptionRevenue);
    }
  });

  it('timeline subscription revenue uses pricePaid like the totals do', async () => {
    const { revenueTimeline } = await getSummary();
    const total = (revenueTimeline as TimelineRow[]).reduce(
      (sum, row) => sum + row.subscriptionRevenue,
      0,
    );
    expect(total).toBe(80);
  });
});
