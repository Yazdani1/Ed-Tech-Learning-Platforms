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

const parseDate = (value: unknown, label: string): Date | undefined => {
	if (value === undefined || value === '') return undefined;
	const date = typeof value === 'string' ? new Date(value) : new Date(Number.NaN);
	if (Number.isNaN(date.getTime())) throw new AppError(`Invalid ${label} date`, 400);
	return date;
};

/** ?from= (included) and ?to= (excluded) as ISO date-times: the browser sends the month or range it shows. */
const dateRange = (fromValue: unknown, toValue: unknown): Record<string, Date> | undefined => {
	const from = parseDate(fromValue, 'from');
	const to = parseDate(toValue, 'to');
	if (from && to && from >= to) throw new AppError('The from date must be before the to date', 400);
	if (!from && !to) return undefined;
	return { ...(from ? { $gte: from } : {}), ...(to ? { $lt: to } : {}) };
};

/** The filter of ?type=, ?courseIds= (comma separated), ?from= and ?to=. */
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
	const range = dateRange(query.from, query.to);
	if (range) filter.createdAt = range;
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
	vat: number;
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

type Row = {
	enrollmentType: string;
	listPrice?: number;
	paidPrice?: number;
	vatAmount?: number;
	createdAt: Date;
	course?: unknown;
};

const series = (rows: Row[], start: Date, keys: string[], keyOf: (date: Date) => string): Point[] => {
	const buckets = new Map<string, Point>(keys.map((key) => [key, { date: key, revenue: 0, vat: 0, orders: 0, paidOrders: 0 }]));
	rows.forEach((row) => {
		const date = new Date(row.createdAt);
		const bucket = date >= start ? buckets.get(keyOf(date)) : undefined;
		if (!bucket) return;
		bucket.revenue += enrollmentRevenue(row);
		bucket.vat += row.vatAmount ?? 0;
		bucket.orders += 1;
		if (row.enrollmentType === 'paid') bucket.paidOrders += 1;
	});
	return Array.from(buckets.values()).map((point) => ({ ...point, revenue: money(point.revenue), vat: money(point.vat) }));
};

const sumSince = (rows: Row[], start: Date) => {
	const since = rows.filter((row) => new Date(row.createdAt) >= start);
	return {
		revenue: money(since.reduce((sum, row) => sum + enrollmentRevenue(row), 0)),
		vat: money(since.reduce((sum, row) => sum + (row.vatAmount ?? 0), 0)),
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
		.select('course enrollmentType listPrice paidPrice vatAmount createdAt')
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

const TOP_COURSES = 5;
const MONTH_KEY_FORMAT = 'yyyy-MM';

/** What an order earned, in an aggregation: the same rule as utils/revenue enrollmentRevenue. */
const REVENUE_EXPR = {
	$cond: [
		{ $ne: ['$enrollmentType', 'paid'] },
		0,
		{
			$cond: [
				{ $gt: [{ $ifNull: ['$listPrice', 0] }, 0] },
				{ $ifNull: ['$paidPrice', 0] },
				{
					$cond: [
						{ $gt: [{ $ifNull: ['$paidPrice', 0] }, 0] },
						'$paidPrice',
						{ $ifNull: ['$courseDoc.price', 0] },
					],
				},
			],
		},
	],
};

/** Adds the course (title, batch, price) and `earned` to every order. */
const withEarned = (filter: Record<string, unknown>) => [
	{ $match: filter },
	{
		$lookup: {
			from: 'courses',
			localField: 'course',
			foreignField: '_id',
			as: 'courseDocs',
			pipeline: [{ $project: { title: 1, batchNumber: 1, price: 1 } }],
		},
	},
	{ $addFields: { courseDoc: { $first: '$courseDocs' } } },
	{ $addFields: { earned: REVENUE_EXPR } },
];

const isPaid = { $cond: [{ $eq: ['$enrollmentType', 'paid'] }, 1, 0] };
const countType = (type: string) => ({ $sum: { $cond: [{ $eq: ['$enrollmentType', type] }, 1, 0] } });

/**
 * GET /api/revenue/months?tz&type&courseIds: one row per month with orders (newest first; this month always
 * included): revenue, VAT, orders and paid orders, in the viewer's time zone.
 */
export const getRevenueMonths = asyncHandler(async (req: Request, res: Response) => {
	const zone = resolveTimeZone(req.query.tz);
	const filter = orderFilter(req.query);
	const rows = await Enrollment.aggregate<{ _id: string; revenue: number; vat: number; orders: number; paidOrders: number }>([
		...withEarned(filter),
		{
			$group: {
				_id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: zone } },
				revenue: { $sum: '$earned' },
				vat: { $sum: { $ifNull: ['$vatAmount', 0] } },
				orders: { $sum: 1 },
				paidOrders: { $sum: isPaid },
			},
		},
		{ $sort: { _id: -1 } },
	]);
	const months = rows.map((row) => ({
		month: row._id,
		revenue: money(row.revenue),
		vat: money(row.vat),
		orders: row.orders,
		paidOrders: row.paidOrders,
	}));
	const current = DateTime.now().setZone(zone).toFormat(MONTH_KEY_FORMAT);
	if (!months.some((row) => row.month === current))
		months.unshift({ month: current, revenue: 0, vat: 0, orders: 0, paidOrders: 0 });
	res.status(200).json({ success: true, data: months });
});

interface BreakdownFacet {
	totals: Array<{
		orders: number;
		paidOrders: number;
		freeOrders: number;
		subscriptionOrders: number;
		revenue: number;
		vat: number;
		listTotal: number;
		discountTotal: number;
	}>;
	topCourses: Array<{ _id: Types.ObjectId; title?: string; batchNumber?: string; revenue: number; orders: number }>;
}

/**
 * GET /api/revenue/breakdown?type&courseIds&from&to: the totals of every matching order (orders by type,
 * revenue, VAT, list prices, discounts) and the 5 courses that earned the most.
 */
export const getRevenueBreakdown = asyncHandler(async (req: Request, res: Response) => {
	const filter = orderFilter(req.query);
	const [facet] = await Enrollment.aggregate<BreakdownFacet>([
		...withEarned(filter),
		{
			$facet: {
				totals: [
					{
						$group: {
							_id: null,
							orders: { $sum: 1 },
							paidOrders: countType('paid'),
							freeOrders: countType('free'),
							subscriptionOrders: countType('subscription'),
							revenue: { $sum: '$earned' },
							vat: { $sum: { $ifNull: ['$vatAmount', 0] } },
							listTotal: { $sum: { $cond: [{ $eq: ['$enrollmentType', 'paid'] }, { $ifNull: ['$listPrice', 0] }, 0] } },
							discountTotal: { $sum: { $ifNull: ['$discountAmount', 0] } },
						},
					},
				],
				topCourses: [
					{ $match: { enrollmentType: 'paid' } },
					{
						$group: {
							_id: '$course',
							title: { $first: '$courseDoc.title' },
							batchNumber: { $first: '$courseDoc.batchNumber' },
							revenue: { $sum: '$earned' },
							orders: { $sum: 1 },
						},
					},
					{ $sort: { revenue: -1, orders: -1 } },
					{ $limit: TOP_COURSES },
				],
			},
		},
	]);
	const totals = facet?.totals[0];
	res.status(200).json({
		success: true,
		data: {
			orders: totals?.orders ?? 0,
			paidOrders: totals?.paidOrders ?? 0,
			freeOrders: totals?.freeOrders ?? 0,
			subscriptionOrders: totals?.subscriptionOrders ?? 0,
			revenue: money(totals?.revenue ?? 0),
			vat: money(totals?.vat ?? 0),
			netRevenue: money((totals?.revenue ?? 0) - (totals?.vat ?? 0)),
			listTotal: money(totals?.listTotal ?? 0),
			discountTotal: money(totals?.discountTotal ?? 0),
			topCourses: (facet?.topCourses ?? []).map((row) => ({
				courseId: String(row._id),
				title: row.title ?? '',
				batchNumber: row.batchNumber ?? '',
				revenue: money(row.revenue),
				orders: row.orders,
			})),
		},
	});
});
