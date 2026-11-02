import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import app from '../../src/app';
import { Enrollment } from '../../src/models/Enrollment.model';
import {
  authCookie,
  bearer,
  createCourse,
  createUser,
  createUsersForAllRoles,
  missingId,
  ROLES,
} from '../factories';
import { daysAgo } from '../factories/admin-messaging';

import type { ICourse } from '../../src/models/Course.model';
import type { IUser } from '../../src/models/User.model';
import type { UserRole } from '../../src/types/index';

type Chart = { date: string; revenue: number; enrollments: number; paidEnrollments: number };

/** yyyy-MM-dd in UTC (the default report zone) */
const isoDay = (date: Date): string => date.toISOString().slice(0, 10);

const OVERVIEW = '/api/performance/overview';
const COURSES = '/api/performance/courses';
const DAYS_7D_BUCKETS = 7;
const DAYS_30D_BUCKETS = 30;
const HOURS = 24;
const MAX_LIFETIME_BUCKETS = 12;

let users: Record<UserRole, IUser>;
let courseA: ICourse;
let courseB: ICourse;
let emptyCourse: ICourse;
let admin: string;

beforeAll(async () => {
  users = await createUsersForAllRoles();
  admin = authCookie(users['Super Admin']);
  const base = { createdBy: users.Admin._id };
  courseA = await createCourse({ ...base, pricing: 'Paid', price: 100 });
  courseB = await createCourse({ ...base, pricing: 'Paid', price: 300 });
  emptyCourse = await createCourse({ ...base });
  const [s1, s2, s3, s4] = await Promise.all([
    createUser('Student'),
    createUser('Student'),
    createUser('Student'),
    createUser('Student'),
  ]);
  // course A: today paid 80 (paidPrice), today paid with fallback to course price 100, today free,
  // 3 days ago subscription, 20 days ago paid 50, 90 days ago paid 25
  await Enrollment.create({
    student: s1._id,
    course: courseA._id,
    enrollmentType: 'paid',
    paidPrice: 80,
  });
  await Enrollment.create({
    student: s2._id,
    course: courseA._id,
    enrollmentType: 'paid',
    paidPrice: 0,
  });
  await Enrollment.create({ student: s3._id, course: courseA._id, enrollmentType: 'free' });
  await Enrollment.create({
    student: s4._id,
    course: courseA._id,
    enrollmentType: 'subscription',
    createdAt: daysAgo(3),
  });
  await Enrollment.create({
    student: users.Student._id,
    course: courseA._id,
    enrollmentType: 'paid',
    paidPrice: 50,
    createdAt: daysAgo(20),
  });
  // course B: 90 days ago paid with paidPrice 25 (outside 30d)
  await Enrollment.create({
    student: s1._id,
    course: courseB._id,
    enrollmentType: 'paid',
    paidPrice: 25,
    createdAt: daysAgo(90),
  });
});

const overview = (query = '') => request(app).get(`${OVERVIEW}${query}`).set('Cookie', admin);

describe('performance: access', () => {
  it.each([OVERVIEW, COURSES])('401 without a token on %s', async (url) => {
    const res = await request(app).get(url);
    expect(res.status).toBe(401);
  });

  it.each(
    ROLES.filter((role) => role !== 'Super Admin').flatMap((role) =>
      [OVERVIEW, COURSES].map((url) => [role, url] as const),
    ),
  )('403 for %s on %s', async (role, url) => {
    const res = await request(app).get(url).set('Cookie', authCookie(users[role]));
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('works with the Bearer header', async () => {
    const res = await request(app).get(OVERVIEW).set('Authorization', bearer(users['Super Admin']));
    expect(res.status).toBe(200);
  });
});

describe('GET /api/performance/overview', () => {
  it('all courses: totals, this-month numbers and the free/paid/subscription breakdown', async () => {
    const res = await overview();
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const data = res.body.data;
    expect(data.totalEnrollments).toBe(6);
    // 80 + fallback 100 + 50 + 25 (subscription and free enrollments earn nothing)
    expect(data.totalRevenue).toBe(255);
    expect(data.breakdown).toEqual({ free: 1, paid: 4, subscription: 1 });
    expect(data.thisMonthCount).toBeGreaterThanOrEqual(3);
    expect(data.thisMonthRevenue).toBeGreaterThanOrEqual(180);
    expect(data.thisMonthRevenue).toBeLessThanOrEqual(255);
    expect(Object.keys(data).sort()).toEqual([
      'breakdown',
      'chartData',
      'granularity',
      'periods',
      'selected',
      'thisMonthCount',
      'thisMonthRevenue',
      'totalEnrollments',
      'totalRevenue',
    ]);
  });

  it('filters by courseId', async () => {
    const res = await overview(`?courseId=${courseB._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.totalEnrollments).toBe(1);
    expect(res.body.data.totalRevenue).toBe(25);
    expect(res.body.data.breakdown).toEqual({ free: 0, paid: 1, subscription: 0 });
  });

  it('courseId=all behaves like no filter; an unknown course gives zeros', async () => {
    const all = await overview('?courseId=all');
    expect(all.body.data.totalEnrollments).toBe(6);
    const none = await overview(`?courseId=${missingId()}`);
    expect(none.status).toBe(200);
    expect(none.body.data.totalEnrollments).toBe(0);
    expect(none.body.data.totalRevenue).toBe(0);
  });

  it('400 for a malformed courseId', async () => {
    const res = await overview('?courseId=not-an-id');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('does not pass a courseId operator object into the query (it is ignored)', async () => {
    const res = await overview('?courseId[$ne]=x');
    expect(res.status).toBe(200);
    expect(res.body.data.totalEnrollments).toBe(6);
  });

  it('30d (default) gives one bucket per day with the right sums', async () => {
    const res = await overview(`?courseId=${courseA._id}`);
    const chart = res.body.data.chartData as Chart[];
    expect(res.body.data.granularity).toBe('day');
    expect(chart).toHaveLength(DAYS_30D_BUCKETS);
    const today = chart.find((row) => row.date === isoDay(new Date()));
    expect(today).toEqual({
      date: isoDay(new Date()),
      revenue: 180,
      enrollments: 3,
      paidEnrollments: 2,
    });
    const threeDays = chart.find((row) => row.date === isoDay(daysAgo(3)));
    expect(threeDays).toMatchObject({ revenue: 0, enrollments: 1 });
    expect(chart.reduce((sum, row) => sum + row.enrollments, 0)).toBe(5);
    expect(chart.reduce((sum, row) => sum + row.revenue, 0)).toBe(230);
  });

  it('7d = today and the 6 days before (7 day buckets)', async () => {
    const res = await overview(`?courseId=${courseA._id}&dateRange=7d`);
    const chart = res.body.data.chartData as Chart[];
    expect(chart).toHaveLength(DAYS_7D_BUCKETS);
    expect(chart[chart.length - 1].date).toBe(isoDay(new Date()));
    expect(chart.reduce((sum, row) => sum + row.enrollments, 0)).toBe(4);
    // totals are all-time whatever the range
    expect(res.body.data.totalEnrollments).toBe(5);
  });

  it('lifetime groups by month (YYYY-MM)', async () => {
    const res = await overview('?dateRange=lifetime');
    const chart = res.body.data.chartData as Chart[];
    for (const row of chart) expect(row.date).toMatch(/^\d{4}-\d{2}$/);
    expect(chart.reduce((sum, row) => sum + row.enrollments, 0)).toBe(6);
    expect(chart.reduce((sum, row) => sum + row.revenue, 0)).toBe(255);
  });

  it('lifetime for a course without enrollments does not build a chart back to 1970', async () => {
    const res = await overview(`?courseId=${emptyCourse._id}&dateRange=lifetime`);
    expect(res.status).toBe(200);
    expect(res.body.data.chartData.length).toBeLessThanOrEqual(MAX_LIFETIME_BUCKETS);
  });

  it('today is charted per hour (24 buckets) and "selected" holds the range numbers', async () => {
    const res = await overview(`?courseId=${courseA._id}&dateRange=today`);
    expect(res.status).toBe(200);
    expect(res.body.data.granularity).toBe('hour');
    expect(res.body.data.chartData).toHaveLength(HOURS);
    expect(res.body.data.selected).toEqual({
      revenue: 180,
      enrollments: 3,
      paidEnrollments: 2,
      breakdown: { free: 1, paid: 2, subscription: 0 },
    });
  });

  it('periods: today, last 7 days, this month and lifetime for the selection', async () => {
    const res = await overview(`?courseId=${courseA._id}`);
    const { periods } = res.body.data;
    expect(periods.today).toEqual({ revenue: 180, enrollments: 3, paidEnrollments: 2 });
    expect(periods.week).toEqual({ revenue: 180, enrollments: 4, paidEnrollments: 2 });
    expect(periods.lifetime).toEqual({ revenue: 230, enrollments: 5, paidEnrollments: 3 });
  });

  it('several courses at once with courseIds=a,b', async () => {
    const res = await overview(`?courseIds=${courseA._id},${courseB._id}&dateRange=lifetime`);
    expect(res.status).toBe(200);
    expect(res.body.data.totalEnrollments).toBe(6);
    expect(res.body.data.totalRevenue).toBe(255);
    const onlyB = await overview(`?courseIds=${courseB._id}`);
    expect(onlyB.body.data.totalEnrollments).toBe(1);
  });

  it('400 for a repeated courseIds parameter and for more than 500 ids', async () => {
    const repeated = await overview(`?courseIds=${courseA._id}&courseIds=${courseB._id}`);
    expect(repeated.status).toBe(400);
    const many = Array.from({ length: 501 }, () => missingId()).join(',');
    const tooMany = await overview(`?courseIds=${many}`);
    expect(tooMany.status).toBe(400);
  });

  it('courseIds=all behaves like no filter', async () => {
    const res = await overview('?courseIds=all&dateRange=lifetime');
    expect(res.body.data.totalEnrollments).toBe(6);
  });

  it('400 when one of the courseIds is malformed', async () => {
    const res = await overview(`?courseIds=${courseA._id},nope`);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('custom range: inclusive days, per-day buckets, only enrolments inside', async () => {
    const from = isoDay(daysAgo(25));
    const to = isoDay(daysAgo(2));
    const res = await overview(`?courseId=${courseA._id}&dateRange=custom&from=${from}&to=${to}`);
    expect(res.status).toBe(200);
    const chart = res.body.data.chartData as Chart[];
    expect(chart[0].date).toBe(from);
    expect(chart[chart.length - 1].date).toBe(to);
    // the 3-days-ago subscription and the 20-days-ago paid 50
    expect(res.body.data.selected).toMatchObject({ enrollments: 2, revenue: 50 });
  });

  it('custom range longer than 92 days is charted per month', async () => {
    const res = await overview(
      `?dateRange=custom&from=${isoDay(daysAgo(200))}&to=${isoDay(new Date())}`,
    );
    expect(res.status).toBe(200);
    expect(res.body.data.granularity).toBe('month');
    expect(res.body.data.selected.enrollments).toBe(6);
  });

  it.each([
    ['missing dates', '?dateRange=custom'],
    ['a bad date', '?dateRange=custom&from=2026-02-30&to=2026-03-01'],
    ['end before start', '?dateRange=custom&from=2026-03-02&to=2026-03-01'],
    ['too long', '?dateRange=custom&from=2000-01-01&to=2026-01-01'],
    ['an unknown time zone', '?tz=Mars/Base'],
  ])('400 for %s', async (_name, query) => {
    const res = await overview(query);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('accepts the viewer time zone (?tz=Asia/Dhaka)', async () => {
    const res = await overview(`?courseId=${courseA._id}&dateRange=7d&tz=Asia/Dhaka`);
    expect(res.status).toBe(200);
    expect(res.body.data.chartData).toHaveLength(DAYS_7D_BUCKETS);
  });

  it('400 for an unknown dateRange', async () => {
    const res = await overview('?dateRange=forever');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/performance/courses', () => {
  it('lists every course newest first with the price fields and the paid-student count', async () => {
    const res = await request(app).get(COURSES).set('Cookie', admin);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const ids = res.body.data.map((course: { _id: string }) => course._id);
    expect(ids).toEqual([String(emptyCourse._id), String(courseB._id), String(courseA._id)]);
    expect(Object.keys(res.body.data[2]).sort()).toEqual(
      ['_id', 'paidStudents', 'pricing', 'price', 'status', 'title'].sort(),
    );
    expect(res.body.data[2].price).toBe(100);
    // course A: three paid enrolments (the free and subscription ones do not count)
    expect(res.body.data[2].paidStudents).toBe(3);
    expect(res.body.data[0].paidStudents).toBe(0);
  });
});
