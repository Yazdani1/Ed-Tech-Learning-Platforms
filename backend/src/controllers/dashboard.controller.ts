import type { Request, Response } from 'express';
import { Course } from '../models/Course.model';
import { Enrollment } from '../models/Enrollment.model';
import { User } from '../models/User.model';
import { Teacher } from '../models/Teacher.model';
import { Category } from '../models/Category.model';
import { Subscription } from '../models/Subscription.model';
import { SubscriptionPlanConfig } from '../models/SubscriptionPlanConfig.model';
import { Question } from '../models/Question.model';
import { asyncHandler } from '../utils/asyncHandler';

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const dayKey = (date: Date) =>
	`${date.getMonth() + 1}/${date.getDate()}`;

const money = (value: number) => Math.round(value * 100) / 100;

export const getDashboardSummary = asyncHandler(
	async (_req: Request, res: Response) => {
		const now = new Date();
		const monthStart = startOfMonth(now);
		const chartStart = new Date(now);
		chartStart.setDate(chartStart.getDate() - 29);
		chartStart.setHours(0, 0, 0, 0);

		const [
			totalUsers,
			totalStudents,
			totalTeachers,
			totalCourses,
			publishedCourses,
			draftCourses,
			totalCategories,
			totalEnrollments,
			thisMonthEnrollments,
			activeSubscriptions,
			openQuestions,
			roleCounts,
			courseStatusCounts,
			coursePricingCounts,
			planConfigs,
			paidEnrollments,
			subscriptions,
			recentEnrollments,
			recentUsers,
			topCourseAgg,
		] = await Promise.all([
			User.countDocuments(),
			User.countDocuments({ role: 'Student' }),
			Teacher.countDocuments(),
			Course.countDocuments(),
			Course.countDocuments({ status: 'Published' }),
			Course.countDocuments({ status: 'Draft' }),
			Category.countDocuments(),
			Enrollment.countDocuments(),
			Enrollment.countDocuments({ createdAt: { $gte: monthStart } }),
			Subscription.countDocuments({ status: 'Active', endDate: { $gt: now } }),
			Question.countDocuments({ isResolved: false }),
			User.aggregate<{ _id: string; count: number }>([
				{ $group: { _id: '$role', count: { $sum: 1 } } },
			]),
			Course.aggregate<{ _id: string; count: number }>([
				{ $group: { _id: '$status', count: { $sum: 1 } } },
			]),
			Course.aggregate<{ _id: string; count: number }>([
				{ $group: { _id: '$pricing', count: { $sum: 1 } } },
			]),
			SubscriptionPlanConfig.find().select('plan price').lean(),
			Enrollment.find({ enrollmentType: 'paid' })
				.populate('course', 'title price')
				.populate('student', 'name email')
				.lean(),
			Subscription.find()
				.populate('user', 'name email')
				.sort({ createdAt: -1 })
				.lean(),
			Enrollment.find()
				.populate('student', 'name email')
				.populate('course', 'title')
				.sort({ createdAt: -1 })
				.limit(6)
				.lean(),
			User.find()
				.select('name email role createdAt')
				.sort({ createdAt: -1 })
				.limit(6)
				.lean(),
			Enrollment.aggregate<{ _id: string; enrollments: number }>([
				{ $group: { _id: '$course', enrollments: { $sum: 1 } } },
				{ $sort: { enrollments: -1 } },
				{ $limit: 5 },
			]),
		]);

		const planPrices = new Map(planConfigs.map((plan) => [plan.plan, plan.price]));

		const courseRevenue = paidEnrollments.reduce((sum, enrollment) => {
			const course = enrollment.course as unknown as { price?: number };
			return sum + (enrollment.paidPrice || course?.price || 0);
		}, 0);

		const subscriptionRevenue = subscriptions.reduce(
			(sum, subscription) => sum + (planPrices.get(subscription.plan) ?? 0),
			0,
		);

		const thisMonthCourseRevenue = paidEnrollments
			.filter((enrollment) => new Date(enrollment.createdAt) >= monthStart)
			.reduce((sum, enrollment) => {
				const course = enrollment.course as unknown as { price?: number };
				return sum + (enrollment.paidPrice || course?.price || 0);
			}, 0);

		const thisMonthSubscriptionRevenue = subscriptions
			.filter((subscription) => new Date(subscription.createdAt) >= monthStart)
			.reduce((sum, subscription) => sum + (planPrices.get(subscription.plan) ?? 0), 0);

		const timeline = new Map<
			string,
			{ date: string; enrollments: number; courseRevenue: number; subscriptionRevenue: number; totalRevenue: number }
		>();
		for (let d = new Date(chartStart); d <= now; d.setDate(d.getDate() + 1)) {
			const key = dayKey(d);
			timeline.set(key, {
				date: key,
				enrollments: 0,
				courseRevenue: 0,
				subscriptionRevenue: 0,
				totalRevenue: 0,
			});
		}

		paidEnrollments.forEach((enrollment) => {
			const date = new Date(enrollment.createdAt);
			if (date < chartStart) return;
			const bucket = timeline.get(dayKey(date));
			if (!bucket) return;
			const course = enrollment.course as unknown as { price?: number };
			bucket.enrollments += 1;
			bucket.courseRevenue += enrollment.paidPrice || course?.price || 0;
		});

		subscriptions.forEach((subscription) => {
			const date = new Date(subscription.createdAt);
			if (date < chartStart) return;
			const bucket = timeline.get(dayKey(date));
			if (!bucket) return;
			bucket.subscriptionRevenue += planPrices.get(subscription.plan) ?? 0;
		});

		const courseIds = topCourseAgg.map((item) => item._id);
		const topCourses = await Course.find({ _id: { $in: courseIds } })
			.select('title coverImage pricing price listPrice discountPrice status')
			.lean();
		const topCourseMap = new Map(topCourses.map((course) => [String(course._id), course]));

		res.status(200).json({
			success: true,
			data: {
				totals: {
					users: totalUsers,
					students: totalStudents,
					teachers: totalTeachers,
					courses: totalCourses,
					publishedCourses,
					draftCourses,
					categories: totalCategories,
					enrollments: totalEnrollments,
					thisMonthEnrollments,
					activeSubscriptions,
					openQuestions,
					totalRevenue: money(courseRevenue + subscriptionRevenue),
					thisMonthRevenue: money(thisMonthCourseRevenue + thisMonthSubscriptionRevenue),
					courseRevenue: money(courseRevenue),
					subscriptionRevenue: money(subscriptionRevenue),
				},
				roleCounts: roleCounts.map((item) => ({ label: item._id, value: item.count })),
				courseStatusCounts: courseStatusCounts.map((item) => ({ label: item._id, value: item.count })),
				coursePricingCounts: coursePricingCounts.map((item) => ({ label: item._id, value: item.count })),
				revenueTimeline: Array.from(timeline.values()).map((item) => ({
					...item,
					courseRevenue: money(item.courseRevenue),
					subscriptionRevenue: money(item.subscriptionRevenue),
					totalRevenue: money(item.courseRevenue + item.subscriptionRevenue),
				})),
				topCourses: topCourseAgg.map((item) => ({
					course: topCourseMap.get(String(item._id)) ?? null,
					enrollments: item.enrollments,
				})),
				recentEnrollments: recentEnrollments.map((enrollment) => ({
					_id: enrollment._id,
					student: enrollment.student,
					course: enrollment.course,
					enrollmentType: enrollment.enrollmentType,
					createdAt: enrollment.createdAt,
				})),
				recentUsers,
			},
		});
	},
);
