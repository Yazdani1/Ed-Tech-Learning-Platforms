import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Course } from '../models/Course.model';
import { Enrollment, PAYMENT_METHODS, type EnrollmentType, type PaymentMethod } from '../models/Enrollment.model';
import { User } from '../models/User.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { isCourseTeacher } from '../utils/courseAccess';
import { enrollmentRevenue } from '../utils/revenue';
import { claimCouponUse, courseListPrice, releaseCouponUse, resolveCoupon, type CourseOffer } from '../utils/courseOffer';

const money = (value: number) => Math.round(value * 100) / 100;

const FREE_SNAPSHOT = {
	listPrice: 0,
	paidPrice: 0,
	discountAmount: 0,
	discountPercent: 0,
	currency: 'BDT',
};

/** The order of a paid enrolment: the list price, less the coupon the buyer applied (one per order). */
const getCourseOrderSnapshot = (listPrice: number, offer: CourseOffer | null) => {
	if (!offer) return { ...FREE_SNAPSHOT, listPrice, paidPrice: listPrice };
	return {
		listPrice,
		paidPrice: offer.price,
		discountAmount: offer.discountAmount,
		discountPercent: money(Math.min((offer.discountAmount / (listPrice || 1)) * 100, 100)),
		currency: 'BDT',
		couponCode: offer.code,
		couponSource: offer.source,
	};
};

/** Optional payment method of a paid enrolment (only recorded: there is no gateway yet). */
const parsePaymentMethod = (value: unknown): PaymentMethod | undefined => {
	if (value === undefined || value === null || value === '') return undefined;
	if (typeof value !== 'string' || !(PAYMENT_METHODS as readonly string[]).includes(value))
		throw new AppError('Invalid payment method', 400);
	return value as PaymentMethod;
};

const parseCouponCode = (value: unknown): string | undefined => {
	if (value === undefined || value === null || value === '') return undefined;
	if (typeof value !== 'string' || value.length > 40) throw new AppError('Invalid coupon code', 400);
	return value;
};

export const enroll = asyncHandler(async (req: Request, res: Response) => {
	const courseId = String(req.params.courseId);
	const studentId = String(req.user._id);

	const course = await Course.findById(courseId);
	if (!course) throw new AppError('Course not found', 404);
	if (course.status !== 'Published' || course.visibility === 'Private')
		throw new AppError('This course is not available for enrollment', 400);

	const existing = await Enrollment.findOne({
		student: studentId,
		course: courseId,
	});
	if (existing) throw new AppError('Already enrolled in this course', 400);

	// Auto-detect enrollment type
	let enrollmentType: EnrollmentType = 'free';
	if (course.pricing === 'Paid') {
		const requestedType = String(req.body?.enrollmentType ?? '');
		if (requestedType === 'paid') {
			enrollmentType = 'paid';
		} else {
			const student = await User.findById(studentId).select('activeSubscription');
			const sub = student?.activeSubscription;
			if (
				sub &&
				course.includedInSubscription &&
				course.allowedSubscriptionPlans.includes(sub.plan) &&
				new Date(sub.endDate) > new Date()
			) {
				enrollmentType = 'subscription';
			} else {
				enrollmentType = 'paid';
			}
		}
	}

	const paymentMethod = enrollmentType === 'paid' ? parsePaymentMethod(req.body?.paymentMethod) : undefined;
	const couponCode = enrollmentType === 'paid' ? parseCouponCode(req.body?.couponCode) : undefined;
	// The price always comes from the database: the list price, less a coupon that is valid right now
	const offer = couponCode ? await resolveCoupon(course, couponCode) : null;
	if (offer && !(await claimCouponUse(offer))) throw new AppError('This coupon code has no uses left', 400);
	const orderSnapshot = enrollmentType === 'paid' ? getCourseOrderSnapshot(courseListPrice(course), offer) : FREE_SNAPSHOT;

	try {
		await Enrollment.create({
			student: new Types.ObjectId(studentId),
			course: new Types.ObjectId(courseId),
			enrollmentType,
			...orderSnapshot,
			...(paymentMethod ? { paymentMethod } : {}),
		});
	} catch (err) {
		if (offer) await releaseCouponUse(offer);
		throw err;
	}

	res.status(201).json({ success: true, message: 'Enrolled successfully' });
});

export const getMyEnrollments = asyncHandler(
	async (req: Request, res: Response) => {
		const enrollments = await Enrollment.find({ student: String(req.user._id) })
			.populate({
				path: 'course',
				populate: [
					{ path: 'category', select: 'name slug' },
					{ path: 'courseType', select: 'name slug description' },
					{ path: 'teachers', select: 'name profileImage' },
				],
			})
			.sort({ createdAt: -1 });

		const courses = enrollments
			.filter((e) => Boolean(e.course))
			.map((e) => ({
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				...(e.course as any).toObject(),
				enrollmentType: e.enrollmentType,
			}));

		res
			.status(200)
			.json({ success: true, data: courses, total: courses.length });
	},
);

export const checkEnrollment = asyncHandler(
	async (req: Request, res: Response) => {
		const enrollment = await Enrollment.findOne({
			student: String(req.user._id),
			course: String(req.params.courseId),
		});

		res.status(200).json({
			success: true,
			data: {
				isEnrolled: !!enrollment,
				enrolledAt: enrollment?.createdAt ?? null,
			},
		});
	},
);

export const getCourseEnrollments = asyncHandler(
	async (req: Request, res: Response) => {
		const courseId = String(req.params.courseId);
		const { type } = req.query;

		const filter: Record<string, unknown> = { course: courseId };
		if (type && ['free', 'paid', 'subscription'].includes(String(type))) {
			filter.enrollmentType = type;
		}

		const enrollments = await Enrollment.find(filter)
			.populate('student', 'name email avatar phone studentNumber')
			.populate('course', 'title price listPrice discountPrice pricing batchNumber')
			.sort({ createdAt: -1 });

		res
			.status(200)
			.json({ success: true, data: enrollments, total: enrollments.length });
	},
);

export const getCourseEnrolledStudents = asyncHandler(
	async (req: Request, res: Response) => {
		const courseId = String(req.params.courseId);
		const includeEmail = req.user.role !== 'Teacher';

		if (req.user.role === 'Teacher') {
			const course = await Course.findById(courseId).select('teachers');
			if (!course) throw new AppError('Course not found', 404);
			if (!(await isCourseTeacher(req.user, course))) {
				throw new AppError('You are not assigned to this course', 403);
			}
		}

		const enrollments = await Enrollment.find({ course: courseId })
			.populate('student', includeEmail ? 'name email avatar' : 'name avatar')
			.sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			data: enrollments.map((enrollment) => ({
				_id: enrollment._id,
				student: enrollment.student,
				enrollmentType: enrollment.enrollmentType,
				createdAt: enrollment.createdAt,
				updatedAt: enrollment.updatedAt,
			})),
			total: enrollments.length,
		});
	},
);

export const exportCourseEnrolledStudents = asyncHandler(
	async (req: Request, res: Response) => {
		const courseId = String(req.params.courseId);
		const enrollments = await Enrollment.find({ course: courseId })
			.populate('student', 'name email')
			.sort({ createdAt: -1 });

		const escapeCsv = (value: unknown) => {
			let text = String(value ?? '');
			// Neutralise spreadsheet formulas (CSV injection).
			if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
			return `"${text.replace(/"/g, '""')}"`;
		};

		const rows = [
			['Student Name', 'Email Address'].map(escapeCsv).join(','),
			...enrollments.map((enrollment) => {
				const student = enrollment.student as unknown as {
					name?: string;
					email?: string;
				};
				return [student?.name, student?.email].map(escapeCsv).join(',');
			}),
		];

		res.setHeader('Content-Type', 'text/csv; charset=utf-8');
		res.setHeader(
			'Content-Disposition',
			`attachment; filename="course-${courseId}-students.csv"`,
		);
		res.status(200).send(rows.join('\n'));
	},
);

export const getCourseEnrollmentCount = asyncHandler(
	async (req: Request, res: Response) => {
		const courseId = String(req.params.courseId);
		const count = await Enrollment.countDocuments({ course: courseId });
		res.status(200).json({ success: true, data: { count } });
	},
);

export const getCourseEnrollmentStats = asyncHandler(
	async (req: Request, res: Response) => {
		const courseId = String(req.params.courseId);
		const now = new Date();
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

		const [total, free, paid, subscription, paidEnrollments, thisMonth] = await Promise.all([
			Enrollment.countDocuments({ course: courseId }),
			Enrollment.countDocuments({ course: courseId, enrollmentType: 'free' }),
			Enrollment.countDocuments({ course: courseId, enrollmentType: 'paid' }),
			Enrollment.countDocuments({
				course: courseId,
				enrollmentType: 'subscription',
			}),
			Enrollment.find({
				course: courseId,
				enrollmentType: 'paid',
			}).populate('course', 'price pricing'),
			Enrollment.find({
				course: courseId,
				createdAt: { $gte: startOfMonth },
			}).populate('course', 'price pricing'),
		]);

		const thisMonthCount = thisMonth.length;
		// Same money rule as the reports: a saved order earns its paid price (0 after a 100% coupon)
		const lifetimeEarned = paidEnrollments.reduce((sum, e) => sum + enrollmentRevenue(e), 0);
		const thisMonthEarned = thisMonth.reduce((sum, e) => sum + enrollmentRevenue(e), 0);

		res.status(200).json({
			success: true,
			data: {
				total,
				free,
				paid,
				subscription,
				lifetimeEarned,
				thisMonthCount,
				thisMonthEarned,
			},
		});
	},
);
