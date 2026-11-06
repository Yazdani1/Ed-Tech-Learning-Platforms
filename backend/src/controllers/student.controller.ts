import type { Request, Response } from 'express';
import { Types } from 'mongoose';
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
const STUDENT_FIELDS = 'name email phone studentNumber avatar createdAt';

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

export const getStudents = asyncHandler(async (req: Request, res: Response) => {
	const { search, page, limit } = req.query as Record<string, unknown>;
	const courseIds = parseCourseIds(req.query.courseIds);
	const currentPage = Math.max(Number(page) || 1, 1);
	const perPage = Math.min(Math.max(Number(limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);

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
	// Enrolled in at least one of the selected courses
	if (courseIds.length > 0) filter._id = { $in: await Enrollment.distinct('student', { course: { $in: courseIds } }) };

	const total = await User.countDocuments(filter);
	const safePage = Math.min(currentPage, Math.max(Math.ceil(total / perPage), 1));
	const students = await User.find(filter)
		.select(STUDENT_FIELDS)
		.sort({ createdAt: -1 })
		.skip((safePage - 1) * perPage)
		.limit(perPage)
		.lean();
	const stats = await spendingByStudent(students.map((student) => student._id as Types.ObjectId));

	res.status(200).json({
		success: true,
		data: students.map((student) => {
			const stat = stats.get(String(student._id));
			return { ...student, enrolledCourses: stat?.enrolledCourses ?? 0, totalSpent: money(stat?.totalSpent ?? 0) };
		}),
		total,
		page: safePage,
		limit: perPage,
	});
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
