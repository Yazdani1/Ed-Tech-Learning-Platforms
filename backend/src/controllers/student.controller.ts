import type { Request, Response } from 'express';
import { Types, type PipelineStage } from 'mongoose';
import { User } from '../models/User.model';
import { Course } from '../models/Course.model';
import { Enrollment } from '../models/Enrollment.model';
import { Subscription } from '../models/Subscription.model';
import { SubscriptionPlanConfig } from '../models/SubscriptionPlanConfig.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { escapeRegex } from '../utils/escapeRegex';
import { enrollmentRevenue, money, subscriptionRevenue } from '../utils/revenue';

// Students page (Super Admin, Admin): every student, filtered by the courses they are enrolled in, and one
// student's details (contact, courses bought, subscriptions, money spent).

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
/** More course ids than this in one request is refused */
const MAX_COURSE_IDS = 500;
const STUDENT_FIELDS = 'name email phone studentNumber avatar createdAt isBlocked timeSpentSeconds lastActiveAt';
const EXPORT_MAX = 5000;
const ENROLMENT_FILTERS = ['any', 'none', 'paid', 'free', 'subscription'] as const;
const SORTS: Record<string, Record<string, 1 | -1>> = {
	newest: { createdAt: -1 },
	oldest: { createdAt: 1 },
	name: { name: 1 },
	timeSpent: { timeSpentSeconds: -1, createdAt: -1 },
	lastActive: { lastActiveAt: -1, createdAt: -1 },
};

/** ?courseIds=a,b as ObjectIds (empty = no course filter); 400 for a malformed id. */
const parseCourseIds = (value: unknown): Types.ObjectId[] => {
	if (value === undefined) return [];
	// A repeated parameter or an operator object is refused, never read as "every student"
	if (typeof value !== 'string') throw new AppError('Invalid course id', 400);
	if (!value.trim()) return [];
	const ids = value.split(',').map((id) => id.trim()).filter(Boolean);
	if (ids.length > MAX_COURSE_IDS) throw new AppError('Too many courses selected', 400);
	if (!ids.every((id) => Types.ObjectId.isValid(id))) throw new AppError('Invalid course id', 400);
	return ids.map((id) => new Types.ObjectId(id));
};

const planPriceMap = async (): Promise<Map<string, number>> =>
	new Map((await SubscriptionPlanConfig.find().select('plan price').lean()).map((plan) => [plan.plan, plan.price]));

/** Enrolled-course count and money spent (paid courses + subscriptions) per student id. */
const spendingByStudent = async (studentIds: Types.ObjectId[]) => {
	const [enrollments, subscriptions, planPrices] = await Promise.all([
		Enrollment.find({ student: { $in: studentIds } })
			.select('student course enrollmentType listPrice paidPrice')
			.populate('course', 'price')
			.lean(),
		Subscription.find({ user: { $in: studentIds } }).select('user plan pricePaid').lean(),
		planPriceMap(),
	]);
	const stats = new Map<string, { enrolledCourses: number; totalSpent: number }>();
	const row = (id: unknown) => {
		const key = String(id);
		const existing = stats.get(key) ?? { enrolledCourses: 0, totalSpent: 0 };
		stats.set(key, existing);
		return existing;
	};
	enrollments.forEach((enrollment) => {
		const stat = row(enrollment.student);
		stat.enrolledCourses += 1;
		stat.totalSpent += enrollmentRevenue(enrollment);
	});
	subscriptions.forEach((subscription) => {
		row(subscription.user).totalSpent += subscriptionRevenue(subscription, planPrices);
	});
	return stats;
};

const parseDay = (value: unknown, label: string): Date | undefined => {
	if (value === undefined || value === '') return undefined;
	const date = typeof value === 'string' ? new Date(value) : new Date(Number.NaN);
	if (Number.isNaN(date.getTime())) throw new AppError(`Invalid ${label} date`, 400);
	return date;
};

/**
 * The students filter: ?search, ?courseIds, ?enrollment (any|none|paid|free|subscription), ?status
 * (active|blocked), ?joinedFrom / ?joinedTo (ISO, to excluded), ?hasPhone (true|false).
 */
interface StudentQuery {
	filter: Record<string, unknown>;
	/** null: no enrolment condition; 'none': not enrolled anywhere; otherwise the enrolment match */
	enrolment: Record<string, unknown> | 'none' | null;
}

const studentFilter = (query: Request['query']): StudentQuery => {
	const { search, enrollment, status, hasPhone } = query as Record<string, unknown>;
	const courseIds = parseCourseIds(query.courseIds);
	const filter: Record<string, unknown> = { role: 'Student' };
	if (typeof search === 'string' && search.trim()) {
		const text = search.trim();
		const pattern = escapeRegex(text);
		// "123456789" also finds the student number "123-456-789" (the other fields use the text as typed)
		const numberPattern = /^\d{9}$/.test(text) ? escapeRegex(text.replace(/^(\d{3})(\d{3})(\d{3})$/, '$1-$2-$3')) : pattern;
		filter.$or = [
			{ name: { $regex: pattern, $options: 'i' } },
			{ email: { $regex: pattern, $options: 'i' } },
			{ studentNumber: { $regex: numberPattern } },
			{ phone: { $regex: pattern } },
		];
	}
	if (status !== undefined && status !== '') {
		if (status !== 'active' && status !== 'blocked') throw new AppError('Status must be active or blocked', 400);
		filter.isBlocked = status === 'blocked' ? true : { $ne: true };
	}
	if (hasPhone === 'true') filter.phone = { $exists: true, $ne: '' };
	else if (hasPhone === 'false') filter.$and = [{ $or: [{ phone: { $exists: false } }, { phone: '' }] }];
	const from = parseDay(query.joinedFrom, 'joined from');
	const to = parseDay(query.joinedTo, 'joined to');
	if (from && to && from >= to) throw new AppError('The joined from date must be before the joined to date', 400);
	if (from || to) filter.createdAt = { ...(from ? { $gte: from } : {}), ...(to ? { $lt: to } : {}) };

	const type = enrollment === undefined || enrollment === '' ? 'any' : enrollment;
	if (!ENROLMENT_FILTERS.includes(type as (typeof ENROLMENT_FILTERS)[number]))
		throw new AppError('Invalid enrolment filter', 400);
	const enrolmentMatch: Record<string, unknown> = {
		...(courseIds.length > 0 ? { course: { $in: courseIds } } : {}),
		...(type !== 'any' && type !== 'none' ? { enrollmentType: type } : {}),
	};
	return { filter, enrolment: type === 'none' ? 'none' : Object.keys(enrolmentMatch).length > 0 ? enrolmentMatch : null };
};

/**
 * The students of the filter as aggregation stages: an enrolment condition looks up at most one matching
 * enrolment per student (indexed), instead of loading every enrolled student id.
 */
const studentStages = ({ filter, enrolment }: StudentQuery): PipelineStage[] => {
	if (!enrolment) return [{ $match: filter }];
	const match = enrolment === 'none' ? {} : enrolment;
	return [
		{ $match: filter },
		{
			$lookup: {
				from: 'enrollments',
				let: { studentId: '$_id' },
				pipeline: [{ $match: { $expr: { $eq: ['$student', '$$studentId'] }, ...match } }, { $limit: 1 }, { $project: { _id: 1 } }],
				as: 'matchedEnrolment',
			},
		},
		{ $match: { matchedEnrolment: enrolment === 'none' ? { $size: 0 } : { $ne: [] } } },
	];
};

const STUDENT_PROJECTION = Object.fromEntries(STUDENT_FIELDS.split(' ').map((field) => [field, 1]));

const sortOf = (value: unknown): Record<string, 1 | -1> =>
	typeof value === 'string' && SORTS[value] ? SORTS[value] : { createdAt: -1 };

const withStats = async <T extends { _id: unknown }>(students: T[]) => {
	const stats = await spendingByStudent(students.map((student) => student._id as Types.ObjectId));
	return students.map((student) => {
		const stat = stats.get(String(student._id));
		return { ...student, enrolledCourses: stat?.enrolledCourses ?? 0, totalSpent: money(stat?.totalSpent ?? 0) };
	});
};

export const getStudents = asyncHandler(async (req: Request, res: Response) => {
	const { page, limit } = req.query as Record<string, unknown>;
	const stages = studentStages(studentFilter(req.query));
	const currentPage = Math.max(Number(page) || 1, 1);
	const perPage = Math.min(Math.max(Number(limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);

	const [counted] = await User.aggregate<{ total: number }>([...stages, { $count: 'total' }]);
	const total = counted?.total ?? 0;
	const safePage = Math.min(currentPage, Math.max(Math.ceil(total / perPage), 1));
	const students = await User.aggregate<{ _id: Types.ObjectId }>([
		...stages,
		{ $sort: sortOf(req.query.sort) },
		{ $skip: (safePage - 1) * perPage },
		{ $limit: perPage },
		{ $project: STUDENT_PROJECTION },
	]);

	res.status(200).json({ success: true, data: await withStats(students), total, page: safePage, limit: perPage });
});

// GET /api/students/export — every matching student (up to 5000) with contact details and spending (Super Admin);
// `total` is how many match (more than the rows when the list was cut at 5000)
export const exportStudents = asyncHandler(async (req: Request, res: Response) => {
	const stages = studentStages(studentFilter(req.query));
	const [students, counted] = await Promise.all([
		User.aggregate<{ _id: Types.ObjectId }>([
			...stages,
			{ $sort: sortOf(req.query.sort) },
			{ $limit: EXPORT_MAX },
			{ $project: STUDENT_PROJECTION },
		]),
		User.aggregate<{ total: number }>([...stages, { $count: 'total' }]),
	]);
	res.status(200).json({ success: true, data: await withStats(students), total: counted[0]?.total ?? 0 });
});

export const getStudentCourses = asyncHandler(async (_req: Request, res: Response) => {
	const [courses, counts] = await Promise.all([
		Course.find().select('title coverImage status pricing').sort({ createdAt: -1 }).lean(),
		Enrollment.aggregate<{ _id: Types.ObjectId; enrolled: number; paid: number }>([
			{
				$group: {
					_id: '$course',
					enrolled: { $sum: 1 },
					paid: { $sum: { $cond: [{ $eq: ['$enrollmentType', 'paid'] }, 1, 0] } },
				},
			},
		]),
	]);
	const byCourse = new Map(counts.map((item) => [String(item._id), item]));

	res.status(200).json({
		success: true,
		data: courses.map((course) => {
			const count = byCourse.get(String(course._id));
			return { ...course, enrolledStudents: count?.enrolled ?? 0, paidStudents: count?.paid ?? 0 };
		}),
	});
});

export const getStudentDetails = asyncHandler(async (req: Request, res: Response) => {
	const id = String(req.params.id);
	if (!Types.ObjectId.isValid(id)) throw new AppError('Invalid student id', 400);
	const student = await User.findOne({ _id: id, role: 'Student' })
		.select(`${STUDENT_FIELDS} activeSubscription`)
		.lean();
	if (!student) throw new AppError('Student not found', 404);

	const [enrollments, subscriptions, planPrices] = await Promise.all([
		Enrollment.find({ student: student._id })
			.select('course enrollmentType listPrice paidPrice discountAmount currency createdAt')
			.populate('course', 'title coverImage price pricing')
			.sort({ createdAt: -1 })
			.lean(),
		Subscription.find({ user: student._id })
			.select('plan billingLabel pricePaid status startDate endDate createdAt')
			.sort({ createdAt: -1 })
			.lean(),
		planPriceMap(),
	]);
	const courses = enrollments.map((enrollment) => ({ ...enrollment, amountPaid: money(enrollmentRevenue(enrollment)) }));
	const plans = subscriptions.map((subscription) => ({
		...subscription,
		amountPaid: money(subscriptionRevenue(subscription, planPrices)),
	}));
	const courseSpent = money(courses.reduce((sum, enrollment) => sum + enrollment.amountPaid, 0));
	const subscriptionSpent = money(plans.reduce((sum, subscription) => sum + subscription.amountPaid, 0));

	res.status(200).json({
		success: true,
		data: {
			student,
			enrollments: courses,
			subscriptions: plans,
			totals: {
				enrolledCourses: courses.length,
				paidCourses: courses.filter((enrollment) => enrollment.enrollmentType === 'paid').length,
				courseSpent,
				subscriptionSpent,
				totalSpent: money(courseSpent + subscriptionSpent),
			},
		},
	});
});
