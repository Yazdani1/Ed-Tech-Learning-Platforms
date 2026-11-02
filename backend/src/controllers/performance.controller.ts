import type { Request, Response } from 'express';
import { DateTime } from 'luxon';
import { Types } from 'mongoose';
import { Enrollment } from '../models/Enrollment.model';
import { Course } from '../models/Course.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import {
  MAX_DAILY_BUCKETS,
  bucketKey,
  bucketKeys,
  customRange,
  periodStarts,
  resolveTimeZone,
  type Granularity,
} from '../utils/reportPeriods';
import { enrollmentRevenue, money } from '../utils/revenue';

const DATE_RANGES = ['today', '7d', '30d', 'month', 'lifetime', 'custom'] as const;
type DateRange = (typeof DATE_RANGES)[number];
const THIRTY_DAYS = 30;
/** More course ids than this in one request is refused */
const MAX_COURSE_IDS = 500;

interface ReportEnrollment {
  course?: unknown;
  enrollmentType: string;
  paidPrice?: number;
  createdAt: Date;
}

/** ?courseIds=a,b (or the older ?courseId=a); "all" or nothing = every course. 400 for a malformed id. */
function courseFilterFrom(query: Request['query']): Record<string, unknown> {
  const raw = query.courseIds ?? query.courseId ?? 'all';
  // A repeated parameter (?courseIds=a&courseIds=b) or an operator object is refused, never read as "all"
  if (typeof raw !== 'string') throw new AppError('Invalid course id', 400);
  const ids = raw.split(',').map((id) => id.trim()).filter((id) => id && id !== 'all');
  if (ids.length === 0) return {};
  if (ids.length > MAX_COURSE_IDS) throw new AppError('Too many courses selected', 400);
  if (!ids.every((id) => Types.ObjectId.isValid(id))) throw new AppError('Invalid course id', 400);
  return { course: { $in: ids.map((id) => new Types.ObjectId(id)) } };
}

/** Start, end and chart buckets of the chosen range (lifetime starts at the first enrolment). */
function rangeOf(dateRange: DateRange, query: Request['query'], zone: string, enrollments: ReportEnrollment[]) {
  const now = new Date();
  const starts = periodStarts(zone);
  const today = DateTime.fromJSDate(starts.today, { zone });
  // Today: all 24 hours on the axis (the later ones are still empty)
  if (dateRange === 'today') {
    return { start: starts.today, end: today.endOf('day').toJSDate(), granularity: 'hour' as Granularity };
  }
  if (dateRange === '7d') return { start: starts.week, end: now, granularity: 'day' as Granularity };
  if (dateRange === '30d') {
    return { start: today.minus({ days: THIRTY_DAYS - 1 }).toJSDate(), end: now, granularity: 'day' as Granularity };
  }
  if (dateRange === 'month') return { start: starts.month, end: now, granularity: 'day' as Granularity };
  if (dateRange === 'custom') {
    const { start, end, days } = customRange(query.from, query.to, zone);
    return { start, end, granularity: (days > MAX_DAILY_BUCKETS ? 'month' : 'day') as Granularity };
  }
  const first = enrollments.reduce((min, e) => Math.min(min, new Date(e.createdAt).getTime()), now.getTime());
  return { start: new Date(first), end: now, granularity: 'month' as Granularity };
}

/** Revenue, enrolment count, paid enrolment count and type breakdown of a list of enrolments. */
function summarise(enrollments: ReportEnrollment[]) {
  return {
    revenue: money(enrollments.reduce((sum, e) => sum + enrollmentRevenue(e), 0)),
    enrollments: enrollments.length,
    paidEnrollments: enrollments.filter((e) => e.enrollmentType === 'paid').length,
    breakdown: {
      free: enrollments.filter((e) => e.enrollmentType === 'free').length,
      paid: enrollments.filter((e) => e.enrollmentType === 'paid').length,
      subscription: enrollments.filter((e) => e.enrollmentType === 'subscription').length,
    },
  };
}

function chartOf(enrollments: ReportEnrollment[], range: ReturnType<typeof rangeOf>, zone: string) {
  const buckets = new Map(
    bucketKeys(range.start, range.end, zone, range.granularity).map((key) => [
      key,
      { revenue: 0, enrollments: 0, paidEnrollments: 0 },
    ]),
  );
  enrollments.forEach((e) => {
    const date = new Date(e.createdAt);
    // Month buckets span whole months: enrolments outside the range stay out (chart = "selected")
    if (date < range.start || date > range.end) return;
    const bucket = buckets.get(bucketKey(date, zone, range.granularity));
    if (!bucket) return;
    bucket.enrollments++;
    bucket.revenue += enrollmentRevenue(e);
    if (e.enrollmentType === 'paid') bucket.paidEnrollments++;
  });
  return Array.from(buckets.entries()).map(([date, data]) => ({ date, ...data, revenue: money(data.revenue) }));
}

export const getPerformanceOverview = asyncHandler(async (req: Request, res: Response) => {
  const dateRange = (req.query.dateRange ?? '30d') as DateRange;
  if (!DATE_RANGES.includes(dateRange)) throw new AppError('Invalid date range', 400);
  const zone = resolveTimeZone(req.query.tz);
  const courseFilter = courseFilterFrom(req.query);

  // Every enrolment of the selected course(s), with the course price (revenue fallback)
  const allEnrollments = await Enrollment.find(courseFilter)
    .select('course enrollmentType paidPrice createdAt')
    .populate('course', 'price')
    .lean();

  const range = rangeOf(dateRange, req.query, zone, allEnrollments);
  const between = (start: Date, end = new Date()) =>
    allEnrollments.filter((e) => new Date(e.createdAt) >= start && new Date(e.createdAt) <= end);
  const starts = periodStarts(zone);
  const lifetime = summarise(allEnrollments);
  const thisMonth = summarise(between(starts.month));
  const pick = ({ revenue, enrollments, paidEnrollments }: ReturnType<typeof summarise>) => ({
    revenue,
    enrollments,
    paidEnrollments,
  });

  res.json({
    success: true,
    data: {
      thisMonthRevenue: thisMonth.revenue,
      totalRevenue: lifetime.revenue,
      thisMonthCount: thisMonth.enrollments,
      totalEnrollments: lifetime.enrollments,
      periods: {
        today: pick(summarise(between(starts.today))),
        week: pick(summarise(between(starts.week))),
        month: pick(thisMonth),
        lifetime: pick(lifetime),
      },
      // The chosen range (the chart and its pie)
      selected: summarise(between(range.start, range.end)),
      granularity: range.granularity,
      chartData: chartOf(allEnrollments, range, zone),
      breakdown: lifetime.breakdown,
    },
  });
});

export const getPerformanceCourses = asyncHandler(async (_req: Request, res: Response) => {
  const [courses, paidCounts] = await Promise.all([
    Course.find()
      .select('title coverImage pricing price status')
      .sort({ createdAt: -1 })
      .lean(),
    Enrollment.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { enrollmentType: 'paid' } },
      { $group: { _id: '$course', count: { $sum: 1 } } },
    ]),
  ]);
  const paidByCourse = new Map(paidCounts.map((item) => [String(item._id), item.count]));

  res.json({
    success: true,
    data: courses.map((course) => ({ ...course, paidStudents: paidByCourse.get(String(course._id)) ?? 0 })),
  });
});
