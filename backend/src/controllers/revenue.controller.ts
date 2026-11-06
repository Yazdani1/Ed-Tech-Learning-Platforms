import type { Request, Response } from 'express';
import { DateTime } from 'luxon';
import { Types } from 'mongoose';
import { Enrollment } from '../models/Enrollment.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { bucketKey, bucketKeys, periodStarts, resolveTimeZone } from '../utils/reportPeriods';
import { enrollmentRevenue, money } from '../utils/revenue';

const DAILY_DAYS = 30;
const WEEKLY_WEEKS = 12;
const MONTHLY_MONTHS = 12;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const EXPORT_MAX = 5000;
const MAX_COURSE_IDS = 200;
const ORDER_TYPES = ['all', 'paid', 'free', 'subscription'] as const;
type OrderType = (typeof ORDER_TYPES)[number];
const WEEK_FORMAT = 'yyyy-MM-dd';

const STUDENT_FIELDS = 'name email phone studentNumber avatar';
const COURSE_FIELDS = 'title batchNumber coverImage price';

/** The filter of ?type= and ?courseIds= (comma separated). */
const orderFilter = (query: Request['query']): Record<string, unknown> => {
	const type = (query.type ?? 'all') as OrderType;
	if (!ORDER_TYPES.includes(type)) throw new AppError('Type must be all, paid, free or subscription', 400);
	const filter: Record<string, unknown> = {};
	if (type !== 'all') filter.enrollmentType = type;
	if (query.courseIds !== undefined && query.courseIds !== '') {
		if (typeof query.courseIds !== 'string') throw new AppError('Invalid course ids', 400);
		const ids = query.courseIds.split(',').map((id) => id.trim()).filter(Boolean);
		if (ids.length > MAX_COURSE_IDS || ids.some((id) => !Types.ObjectId.isValid(id)))
			throw new AppError('Invalid course ids', 400);
		filter.course = { $in: ids.map((id) => new Types.ObjectId(id)) };
	}
	return filter;
};

const findOrders = (filter: Record<string, unknown>) =>
	Enrollment.find(filter)
		.sort({ createdAt: -1 })
		.populate('student', STUDENT_FIELDS)
		.populate('course', COURSE_FIELDS);

/**
 * GET /api/revenue/orders?type&courseIds&page&limit: every enrolment of every course (an order), newest first,
 * with the student, the course, list price, discount, paid price, coupon and payment method.
 */
export const getRevenueOrders = asyncHandler(async (req: Request, res: Response) => {
	const filter = orderFilter(req.query);
	const page = Math.max(Number(req.query.page) || 1, 1);
	const limit = Math.min(Math.max(Number(req.query.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
	const [orders, total] = await Promise.all([
		findOrders(filter).skip((page - 1) * limit).limit(limit).lean(),
		Enrollment.countDocuments(filter),
	]);
	res.status(200).json({ success: true, data: orders, total, page, limit });
});

/** GET /api/revenue/orders/export?type&courseIds: every matching order (up to 5000) for CSV / PDF. */
export const exportRevenueOrders = asyncHandler(async (req: Request, res: Response) => {
	const filter = orderFilter(req.query);
	const orders = await findOrders(filter).limit(EXPORT_MAX).lean();
	res.status(200).json({ success: true, data: orders, total: orders.length });
});

interface Point {
	date: string;
	revenue: number;
	orders: number;
	paidOrders: number;
}

/** Monday-based weeks: the key is the week's first day. */
const weekKey = (date: Date, zone: string): string =>
	DateTime.fromJSDate(date, { zone }).startOf('week').toFormat(WEEK_FORMAT);

const weekKeys = (start: Date, zone: string): string[] => {
	const keys: string[] = [];
	let cursor = DateTime.fromJSDate(start, { zone }).startOf('week');
	const last = DateTime.now().setZone(zone);
	while (cursor <= last) {
		keys.push(cursor.toFormat(WEEK_FORMAT));
		cursor = cursor.plus({ weeks: 1 });
	}
	return keys;
};

type Row = { enrollmentType: string; listPrice?: number; paidPrice?: number; createdAt: Date; course?: unknown };

const series = (rows: Row[], start: Date, keys: string[], keyOf: (date: Date) => string): Point[] => {
	const buckets = new Map<string, Point>(keys.map((key) => [key, { date: key, revenue: 0, orders: 0, paidOrders: 0 }]));
	rows.forEach((row) => {
		const date = new Date(row.createdAt);
		const bucket = date >= start ? buckets.get(keyOf(date)) : undefined;
		if (!bucket) return;
		bucket.revenue += enrollmentRevenue(row);
		bucket.orders += 1;
		if (row.enrollmentType === 'paid') bucket.paidOrders += 1;
	});
	return Array.from(buckets.values()).map((point) => ({ ...point, revenue: money(point.revenue) }));
};

const sumSince = (rows: Row[], start: Date) => {
	const since = rows.filter((row) => new Date(row.createdAt) >= start);
	return {
		revenue: money(since.reduce((sum, row) => sum + enrollmentRevenue(row), 0)),
		orders: since.length,
		paidOrders: since.filter((row) => row.enrollmentType === 'paid').length,
	};
};

/**
 * GET /api/revenue/summary?tz&type&courseIds: course sales today / last 7 days / this month / all time, and the
 * charts: per day (30 days), per week (12 weeks) and per month (12 months), in the viewer's time zone.
 */
export const getRevenueSummary = asyncHandler(async (req: Request, res: Response) => {
	const zone = resolveTimeZone(req.query.tz);
	const filter = orderFilter(req.query);
	const starts = periodStarts(zone);
	const today = DateTime.fromJSDate(starts.today, { zone });
	const dailyStart = today.minus({ days: DAILY_DAYS - 1 }).toJSDate();
	const weeklyStart = today.startOf('week').minus({ weeks: WEEKLY_WEEKS - 1 }).toJSDate();
	const monthlyStart = today.startOf('month').minus({ months: MONTHLY_MONTHS - 1 }).toJSDate();

	const rows = await Enrollment.find(filter)
		.select('course enrollmentType listPrice paidPrice createdAt')
		.populate('course', 'price')
		.lean<Row[]>();

	res.status(200).json({
		success: true,
		data: {
			totals: {
				today: sumSince(rows, starts.today),
				week: sumSince(rows, starts.week),
				month: sumSince(rows, starts.month),
				lifetime: sumSince(rows, new Date(0)),
			},
			daily: series(rows, dailyStart, bucketKeys(dailyStart, new Date(), zone, 'day'), (date) => bucketKey(date, zone, 'day')),
			weekly: series(rows, weeklyStart, weekKeys(weeklyStart, zone), (date) => weekKey(date, zone)),
			monthly: series(rows, monthlyStart, bucketKeys(monthlyStart, new Date(), zone, 'month'), (date) =>
				bucketKey(date, zone, 'month'),
			),
		},
	});
});
