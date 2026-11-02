import { DateTime } from 'luxon';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import app from '../../src/app';
import { Enrollment } from '../../src/models/Enrollment.model';
import { authCookie, createCourse, createUser } from '../factories';

import type { ICourse } from '../../src/models/Course.model';
import type { IUser } from '../../src/models/User.model';

// The viewer's time zone (?tz=) decides which day, hour and month an enrolment belongs to, on the dashboard and
// the performance report; and a long custom range keeps the chart equal to the "selected" numbers.

const DHAKA = 'Asia/Dhaka';
/** 00:30 today in Dhaka: always "today" there; in UTC it is the evening before (18:30) */
const DHAKA_EARLY_MINUTES = 30;

let admin: string;
let course: ICourse;
let longRangeCourse: ICourse;
let earlyDhaka: Date;

const enrol = async (student: IUser, target: ICourse, createdAt: Date, paidPrice = 100) =>
  Enrollment.create({
    student: student._id,
    course: target._id,
    enrollmentType: 'paid',
    paidPrice,
    createdAt,
  });

beforeAll(async () => {
  admin = authCookie(await createUser('Super Admin'));
  course = await createCourse({ pricing: 'Paid', price: 100 });
  longRangeCourse = await createCourse({ pricing: 'Paid', price: 100 });
  earlyDhaka = DateTime.now()
    .setZone(DHAKA)
    .startOf('day')
    .plus({ minutes: DHAKA_EARLY_MINUTES })
    .toJSDate();
  await enrol(await createUser('Student'), course, earlyDhaka);

  // Long custom range 15 Jan - 10 Jun 2026: one enrolment before it (same first month), one inside, one after
  const [a, b, c] = await Promise.all([
    createUser('Student'),
    createUser('Student'),
    createUser('Student'),
  ]);
  await enrol(a, longRangeCourse, new Date('2026-01-05T12:00:00Z'));
  await enrol(b, longRangeCourse, new Date('2026-01-20T12:00:00Z'));
  await enrol(c, longRangeCourse, new Date('2026-06-20T12:00:00Z'));
});

/** Whether `earlyDhaka` falls on today's date in UTC (it does when UTC is already past 18:00). */
const isTodayInUtc = (): boolean =>
  DateTime.fromJSDate(earlyDhaka).toUTC().hasSame(DateTime.utc(), 'day');

describe('dashboard: periods follow ?tz=', () => {
  it('an enrolment at 00:30 Dhaka time is "today" for a Dhaka viewer, and on the Dhaka date in the timeline', async () => {
    const res = await request(app).get(`/api/dashboard/summary?tz=${DHAKA}`).set('Cookie', admin);
    expect(res.status).toBe(200);
    // the long-range enrolments are all in the past
    expect(res.body.data.revenue.today.enrollments).toBe(1);
    const timeline = res.body.data.revenueTimeline as { date: string; enrollments: number }[];
    const dhakaToday = DateTime.now().setZone(DHAKA).toFormat('yyyy-MM-dd');
    expect(timeline[timeline.length - 1]).toMatchObject({ date: dhakaToday, enrollments: 1 });
  });

  it('in UTC the same enrolment is "today" only when UTC has reached that date', async () => {
    const res = await request(app).get('/api/dashboard/summary').set('Cookie', admin);
    expect(res.status).toBe(200);
    expect(res.body.data.revenue.today.enrollments).toBe(isTodayInUtc() ? 1 : 0);
  });

  it('an empty ?tz= means UTC', async () => {
    const res = await request(app).get('/api/dashboard/summary?tz=').set('Cookie', admin);
    expect(res.status).toBe(200);
  });
});

describe('performance: buckets follow ?tz=', () => {
  it('today is charted per Dhaka hour: the enrolment sits in the 00 hour', async () => {
    const res = await request(app)
      .get(`/api/performance/overview?courseIds=${course._id}&dateRange=today&tz=${DHAKA}`)
      .set('Cookie', admin);
    expect(res.status).toBe(200);
    const chart = res.body.data.chartData as { date: string; enrollments: number }[];
    const hourKey = DateTime.fromJSDate(earlyDhaka).setZone(DHAKA).toFormat("yyyy-MM-dd'T'HH");
    expect(chart.find((row) => row.enrollments > 0)?.date).toBe(hourKey);
    expect(res.body.data.selected.enrollments).toBe(1);
  });

  it('a custom range longer than 92 days (per month) counts only enrolments inside the range', async () => {
    const res = await request(app)
      .get(
        `/api/performance/overview?courseIds=${longRangeCourse._id}&dateRange=custom&from=2026-01-15&to=2026-06-10`,
      )
      .set('Cookie', admin);
    expect(res.status).toBe(200);
    expect(res.body.data.granularity).toBe('month');
    expect(res.body.data.selected.enrollments).toBe(1);
    const chart = res.body.data.chartData as {
      date: string;
      enrollments: number;
      revenue: number;
    }[];
    expect(chart[0].date).toBe('2026-01');
    expect(chart[chart.length - 1].date).toBe('2026-06');
    expect(chart.reduce((sum, row) => sum + row.enrollments, 0)).toBe(
      res.body.data.selected.enrollments,
    );
    expect(chart.reduce((sum, row) => sum + row.revenue, 0)).toBe(res.body.data.selected.revenue);
  });

  it('this month starts on the 1st (per day)', async () => {
    const res = await request(app)
      .get(`/api/performance/overview?courseIds=${course._id}&dateRange=month&tz=${DHAKA}`)
      .set('Cookie', admin);
    expect(res.status).toBe(200);
    expect(res.body.data.granularity).toBe('day');
    expect(res.body.data.chartData[0].date).toBe(
      DateTime.now().setZone(DHAKA).startOf('month').toFormat('yyyy-MM-dd'),
    );
  });
});
