import type { Request, Response } from 'express';
import { Enrollment } from '../models/Enrollment.model';
import { Course } from '../models/Course.model';
import { asyncHandler } from '../utils/asyncHandler';

type DateRange = '7d' | '30d' | 'lifetime';

function rangeStart(dateRange: DateRange): { start: Date; groupByMonth: boolean } {
  const now = new Date();
  if (dateRange === '7d') {
    return { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), groupByMonth: false };
  }
  if (dateRange === '30d') {
    return { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), groupByMonth: false };
  }
  return { start: new Date(0), groupByMonth: true };
}

function dayKey(d: Date) {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export const getPerformanceOverview = asyncHandler(async (req: Request, res: Response) => {
  const courseId = String(req.query.courseId ?? 'all');
  const dateRange = (req.query.dateRange ?? '30d') as DateRange;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const { start, groupByMonth } = rangeStart(dateRange);

  const courseFilter: Record<string, unknown> = {};
  if (courseId !== 'all') courseFilter.course = courseId;

  // Fetch all enrollments for the selected course(s) — with course price
  const allEnrollments = await Enrollment.find(courseFilter)
    .populate('course', 'price')
    .lean();

  // All-time stats
  const totalEnrollments = allEnrollments.length;
  const totalRevenue = allEnrollments
    .filter((e) => e.enrollmentType === 'paid')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .reduce((sum, e) => sum + (e.paidPrice || (e.course as any)?.price || 0), 0);

  // This-month stats
  const thisMonthList = allEnrollments.filter((e) => new Date(e.createdAt) >= startOfMonth);
  const thisMonthCount = thisMonthList.length;
  const thisMonthRevenue = thisMonthList
    .filter((e) => e.enrollmentType === 'paid')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .reduce((sum, e) => sum + (e.paidPrice || (e.course as any)?.price || 0), 0);

  // Chart: filter by date range
  const inRange = allEnrollments.filter((e) => new Date(e.createdAt) >= start);

  // Build empty buckets for every day / month in the range
  const buckets = new Map<string, { revenue: number; enrollments: number }>();

  if (groupByMonth) {
    const earliest =
      inRange.length > 0
        ? new Date(Math.min(...inRange.map((e) => new Date(e.createdAt).getTime())))
        : start;
    let d = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
    while (d <= now) {
      buckets.set(monthKey(d), { revenue: 0, enrollments: 0 });
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    }
  } else {
    const d = new Date(start);
    d.setHours(0, 0, 0, 0);
    while (d <= now) {
      buckets.set(dayKey(d), { revenue: 0, enrollments: 0 });
      d.setDate(d.getDate() + 1);
    }
  }

  // Fill buckets
  inRange.forEach((e) => {
    const d = new Date(e.createdAt);
    const key = groupByMonth ? monthKey(d) : dayKey(d);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.enrollments++;
      if (e.enrollmentType === 'paid') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        bucket.revenue += e.paidPrice || (e.course as any)?.price || 0;
      }
    }
  });

  const chartData = Array.from(buckets.entries()).map(([date, data]) => ({
    date,
    revenue: Math.round(data.revenue * 100) / 100,
    enrollments: data.enrollments,
  }));

  // Pie breakdown (all-time for the course selection)
  const breakdown = {
    free: allEnrollments.filter((e) => e.enrollmentType === 'free').length,
    paid: allEnrollments.filter((e) => e.enrollmentType === 'paid').length,
    subscription: allEnrollments.filter((e) => e.enrollmentType === 'subscription').length,
  };

  res.json({
    success: true,
    data: {
      thisMonthRevenue: Math.round(thisMonthRevenue * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      thisMonthCount,
      totalEnrollments,
      chartData,
      breakdown,
    },
  });
});

export const getPerformanceCourses = asyncHandler(async (_req: Request, res: Response) => {
  const courses = await Course.find()
    .select('title coverImage pricing price listPrice discountPrice status')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: courses });
});
