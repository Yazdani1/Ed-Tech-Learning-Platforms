import type { Request, Response } from 'express';
import { DateTime } from 'luxon';
import { Course } from '../models/Course.model';
import { Enrollment } from '../models/Enrollment.model';
import { User } from '../models/User.model';
import { Teacher } from '../models/Teacher.model';
import { Category } from '../models/Category.model';
import { Subscription } from '../models/Subscription.model';
import { SubscriptionPlanConfig } from '../models/SubscriptionPlanConfig.model';
import { Question } from '../models/Question.model';
import { asyncHandler } from '../utils/asyncHandler';
import { bucketKey, bucketKeys, periodStarts, resolveTimeZone, type Granularity } from '../utils/reportPeriods';
import { enrollmentRevenue, money, subscriptionRevenue } from '../utils/revenue';

const TIMELINE_DAYS = 30;
const TIMELINE_MONTHS = 12;
const TOP_COURSES = 5;

/** One sale or enrolment, reduced to what the report needs. */
interface Entry {
	date: Date;
	course: number;
	subscription: number;
	/** 1 for an enrolment (any type), 0 for a subscription */
	enrollments: number;
	paidEnrollments: number;
}

const emptyTotals = () => ({ total: 0, course: 0, subscription: 0, enrollments: 0, paidEnrollments: 0 });
type PeriodTotals = ReturnType<typeof emptyTotals>;

const addEntry = (totals: PeriodTotals, entry: Entry): void => {
	totals.course += entry.course;
	totals.subscription += entry.subscription;
	totals.total += entry.course + entry.subscription;
	totals.enrollments += entry.enrollments;
	totals.paidEnrollments += entry.paidEnrollments;
};

const rounded = (totals: PeriodTotals): PeriodTotals => ({
	...totals,
	total: money(totals.total),
	course: money(totals.course),
	subscription: money(totals.subscription),
});

/** Sums of the entries since `start`. */
const periodTotals = (entries: Entry[], start: Date): PeriodTotals => {
	const totals = emptyTotals();
	entries.filter((entry) => entry.date >= start).forEach((entry) => addEntry(totals, entry));
	return rounded(totals);
};

/** One row per day / month from `start` to now (empty buckets included), in the viewer's zone. */
const timeline = (entries: Entry[], start: Date, zone: string, granularity: Granularity) => {
	const buckets = new Map(bucketKeys(start, new Date(), zone, granularity).map((key) => [key, emptyTotals()]));
	entries.forEach((entry) => {
		const bucket = entry.date >= start ? buckets.get(bucketKey(entry.date, zone, granularity)) : undefined;
		if (bucket) addEntry(bucket, entry);
	});
	return Array.from(buckets.entries()).map(([date, totals]) => {
		const { total, course, subscription, enrollments, paidEnrollments } = rounded(totals);
		return { date, enrollments, paidEnrollments, courseRevenue: course, subscriptionRevenue: subscription, totalRevenue: total };
	});
};

/** Every enrolment and subscription as one entry with its revenue (the money rules of utils/revenue). */
const toEntries = (
	enrollments: { course?: unknown; enrollmentType: string; paidPrice?: number; createdAt: Date }[],
	subscriptions: { plan: string; pricePaid?: number; createdAt: Date }[],
	planPrices: Map<string, number>,
): Entry[] => [
	...enrollments.map((enrollment) => ({
		date: new Date(enrollment.createdAt),
		course: enrollmentRevenue(enrollment),
		subscription: 0,
		enrollments: 1,
		paidEnrollments: enrollment.enrollmentType === 'paid' ? 1 : 0,
	})),
	...subscriptions.map((subscription) => ({
		date: new Date(subscription.createdAt),
		course: 0,
		subscription: subscriptionRevenue(subscription, planPrices),
		enrollments: 0,
		paidEnrollments: 0,
	})),
];

/** The five courses that earned the most (then the most enrolments), with their enrolment counts. */
const topCourses = async (enrollments: { course?: unknown; enrollmentType: string; paidPrice?: number }[]) => {
	const stats = new Map<string, { enrollments: number; paidEnrollments: number; revenue: number }>();
	enrollments.forEach((enrollment) => {
		const course = enrollment.course as { _id?: unknown } | null | undefined;
		if (!course?._id) return;
		const id = String(course._id);
		const row = stats.get(id) ?? { enrollments: 0, paidEnrollments: 0, revenue: 0 };
		row.enrollments += 1;
		if (enrollment.enrollmentType === 'paid') row.paidEnrollments += 1;
		row.revenue += enrollmentRevenue(enrollment);
		stats.set(id, row);
	});
	const best = Array.from(stats.entries())
		.sort(([, a], [, b]) => b.revenue - a.revenue || b.enrollments - a.enrollments)
		.slice(0, TOP_COURSES);
	const courses = await Course.find({ _id: { $in: best.map(([id]) => id) } })
		.select('title coverImage pricing price status')
		.lean();
	const byId = new Map(courses.map((course) => [String(course._id), course]));
	return best.map(([id, row]) => ({ course: byId.get(id) ?? null, ...row, revenue: money(row.revenue) }));
};

export const getDashboardSummary = asyncHandler(
	async (req: Request, res: Response) => {
		const zone = resolveTimeZone(req.query.tz);
		const starts = periodStarts(zone);
		const today = DateTime.fromJSDate(starts.today, { zone });
		const timelineStart = today.minus({ days: TIMELINE_DAYS - 1 }).toJSDate();
		const monthsStart = today.startOf('month').minus({ months: TIMELINE_MONTHS - 1 }).toJSDate();

		const [
			counts,
			planConfigs,
			enrollments,
			subscriptions,
		] = await Promise.all([
			Promise.all([
				User.countDocuments(),
				User.countDocuments({ role: 'Student' }),
				User.countDocuments({ role: 'Student', createdAt: { $gte: starts.month } }),
				Teacher.countDocuments(),
				Course.countDocuments(),
				Course.countDocuments({ status: 'Published' }),
				Category.countDocuments(),
				Subscription.countDocuments({ status: 'Active', endDate: { $gt: new Date() } }),
				Question.countDocuments({ isResolved: false }),
			]),
			SubscriptionPlanConfig.find().select('plan price').lean(),
			Enrollment.find().select('course enrollmentType paidPrice createdAt').populate('course', 'price').lean(),
			Subscription.find().select('plan pricePaid createdAt').lean(),
		]);
		const [users, students, newStudents, teachers, courses, publishedCourses, categories, activeSubscriptions, openQuestions] = counts;

		const entries = toEntries(enrollments, subscriptions, new Map(planConfigs.map((plan) => [plan.plan, plan.price])));
		const lifetime = periodTotals(entries, new Date(0));
		const thisMonth = periodTotals(entries, starts.month);

		res.status(200).json({
			success: true,
			data: {
				totals: {
					users,
					students,
					newStudentsThisMonth: newStudents,
					teachers,
					courses,
					publishedCourses,
					draftCourses: courses - publishedCourses,
					categories,
					enrollments: lifetime.enrollments,
					thisMonthEnrollments: thisMonth.enrollments,
					activeSubscriptions,
					openQuestions,
					totalRevenue: lifetime.total,
					thisMonthRevenue: thisMonth.total,
					courseRevenue: lifetime.course,
					subscriptionRevenue: lifetime.subscription,
				},
				revenue: {
					today: periodTotals(entries, starts.today),
					week: periodTotals(entries, starts.week),
					month: thisMonth,
					lifetime,
				},
				revenueTimeline: timeline(entries, timelineStart, zone, 'day'),
				monthlyRevenue: timeline(entries, monthsStart, zone, 'month'),
				topCourses: await topCourses(enrollments),
			},
		});
	},
);
