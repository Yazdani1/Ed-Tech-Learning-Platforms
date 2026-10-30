import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Course } from '../models/Course.model';
import { Enrollment } from '../models/Enrollment.model';
import { Section } from '../models/Section.model';
import { Lecture } from '../models/Lecture.model';
import { StudyCurriculum } from '../models/StudyCurriculum.model';
import { StudyMaterial } from '../models/StudyMaterial.model';
import { Announcement } from '../models/Announcement.model';
import { QuizSection } from '../models/QuizSection.model';
import { QuizBank } from '../models/QuizBank.model';
import { QuizAttempt } from '../models/QuizAttempt.model';
import { Question } from '../models/Question.model';
import { Answer } from '../models/Answer.model';
import { Category } from '../models/Category.model';
import { CourseType } from '../models/CourseType.model';
import { Teacher } from '../models/Teacher.model';
import type { IUser } from '../models/User.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { escapeRegex } from '../utils/escapeRegex';
import { isStaff, isCourseTeacher, canAccessCourseContent } from '../utils/courseAccess';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary';
import type { CourseStatus, SubscriptionPlan } from '../types/index';

const normalizeCoursePrices = (pricing: string, listPrice?: number, discountPrice?: number) => {
	if (pricing !== 'Paid') {
		return { listPrice: 0, discountPrice: 0, price: 0 };
	}

	const safeListPrice = Math.max(Number(listPrice ?? discountPrice ?? 0), 0);
	const safeDiscountPrice = Math.max(Number(discountPrice ?? safeListPrice), 0);
	const finalPrice = Math.min(safeDiscountPrice, safeListPrice);

	return { listPrice: safeListPrice, discountPrice: finalPrice, price: finalPrice };
};

const COURSE_VISIBILITIES = ['Public', 'Private'];
const COURSE_PRICINGS = ['Free', 'Paid'];

// A lecture's video address is only sent for free previews (or to people who may watch the course).
const hideLockedVideo = <T extends { isPreview?: boolean; videoUrl?: string }>(lecture: T): T => {
	if (!lecture.isPreview) lecture.videoUrl = undefined;
	return lecture;
};

const parseJsonList = (value: unknown, field: string): string[] => {
	if (typeof value !== 'string') throw new AppError(`Invalid ${field}`, 400);
	let parsed: unknown;
	try {
		parsed = JSON.parse(value);
	} catch {
		throw new AppError(`Invalid ${field}`, 400);
	}
	if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== 'string'))
		throw new AppError(`Invalid ${field}`, 400);
	return parsed as string[];
};

const assertCatalogRef = async (value: unknown, kind: 'category' | 'courseType') => {
	const label = kind === 'category' ? 'Category' : 'Course type';
	if (typeof value !== 'string' || !Types.ObjectId.isValid(value))
		throw new AppError(`Invalid ${label.toLowerCase()} ID`, 400);
	const exists = kind === 'category' ? await Category.exists({ _id: value }) : await CourseType.exists({ _id: value });
	if (!exists) throw new AppError(`${label} not found`, 404);
	return new Types.ObjectId(value);
};

const parseTeacherIds = async (value: unknown) => {
	const ids = parseJsonList(value, 'teachers');
	if (ids.some((id) => !Types.ObjectId.isValid(id))) throw new AppError('Invalid teacher ID', 400);
	const unique = [...new Set(ids)];
	const found = await Teacher.countDocuments({ _id: { $in: unique } });
	if (found !== unique.length) throw new AppError('One or more teachers were not found', 400);
	return ids.map((id) => new Types.ObjectId(id));
};

const assertCourseEnums = (body: { visibility?: unknown; pricing?: unknown }) => {
	if (body.visibility !== undefined && !COURSE_VISIBILITIES.includes(body.visibility as string))
		throw new AppError('Visibility must be Public or Private', 400);
	if (body.pricing !== undefined && !COURSE_PRICINGS.includes(body.pricing as string))
		throw new AppError('Pricing must be Free or Paid', 400);
};

const expireExpiredCourseDiscounts = async () => {
	const now = new Date();
	const expiredCourses = await Course.find({
		pricing: 'Paid',
		discountEndsAt: { $lte: now },
		discountPercent: { $gt: 0 },
	}).select('price listPrice');

	if (expiredCourses.length === 0) return;

	await Course.bulkWrite(
		expiredCourses.map((course) => {
			const listPrice = course.listPrice ?? course.price ?? 0;
			return {
				updateOne: {
					filter: { _id: course._id },
					update: {
						$set: {
							price: listPrice,
							discountPrice: listPrice,
							discountPercent: 0,
						},
						$unset: { discountEndsAt: '' },
					},
				},
			};
		}),
	);
};

export const getCourses = asyncHandler(async (req: Request, res: Response) => {
	await expireExpiredCourseDiscounts();
	const { category, courseType, teacher, status, pricing, visibility, subscriptionPlans, search, enrollmentFilter, earningFilter } = req.query as Record<string, string>;

	const user = req.user as IUser | undefined;
	const staff = Boolean(user && isStaff(user));

	const filter: Record<string, unknown> = {};
	if (category) filter.category = category;
	if (courseType) filter.courseType = courseType;
	if (teacher) filter.teachers = teacher;
	if (status) filter.status = status;
	if (pricing) filter.pricing = pricing;
	if (visibility) filter.visibility = visibility;
	if (subscriptionPlans) {
		const plans = subscriptionPlans.split(',').map((s) => s.trim()).filter(Boolean);
		if (plans.length > 0) {
			filter.includedInSubscription = true;
			filter.allowedSubscriptionPlans = { $in: plans };
		}
	}
	if (typeof search === 'string' && search) filter.title = { $regex: escapeRegex(search), $options: 'i' };
	// Security: only staff see drafts, private courses and enrolment / earning figures.
	if (!staff) {
		filter.status = 'Published';
		filter.visibility = 'Public';
	}

	const courses = await Course.find(filter)
		.populate('category', 'name slug')
		.populate('courseType', 'name slug description')
		.populate('teachers', 'name profileImage')
		.sort({ createdAt: -1 });

	if (!staff) {
		res.status(200).json({ success: true, data: courses, total: courses.length });
		return;
	}

	const now = new Date();
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const courseIds = courses.map((course) => course._id);
	const enrollmentStats = courseIds.length > 0
		? await Enrollment.aggregate<{
			_id: Types.ObjectId;
			totalEnrollments: number;
			paidEnrollments: number;
			lifetimeEarned: number;
			thisMonthCount: number;
			thisMonthPaidEnrollments: number;
			thisMonthEarned: number;
			previousMonthCount: number;
			previousMonthPaidEnrollments: number;
			previousMonthEarned: number;
		}>([
			{ $match: { course: { $in: courseIds } } },
			{
				$group: {
					_id: '$course',
					totalEnrollments: { $sum: 1 },
					paidEnrollments: {
						$sum: { $cond: [{ $eq: ['$enrollmentType', 'paid'] }, 1, 0] },
					},
					lifetimeEarned: {
						$sum: {
							$cond: [
								{ $eq: ['$enrollmentType', 'paid'] },
								{ $ifNull: ['$paidPrice', 0] },
								0,
							],
						},
					},
					thisMonthCount: {
						$sum: { $cond: [{ $gte: ['$createdAt', startOfMonth] }, 1, 0] },
					},
					thisMonthPaidEnrollments: {
						$sum: {
							$cond: [
								{
									$and: [
										{ $eq: ['$enrollmentType', 'paid'] },
										{ $gte: ['$createdAt', startOfMonth] },
									],
								},
								1,
								0,
							],
						},
					},
					thisMonthEarned: {
						$sum: {
							$cond: [
								{
									$and: [
										{ $eq: ['$enrollmentType', 'paid'] },
										{ $gte: ['$createdAt', startOfMonth] },
									],
								},
								{ $ifNull: ['$paidPrice', 0] },
								0,
							],
						},
					},
					previousMonthCount: {
						$sum: {
							$cond: [
								{
									$and: [
										{ $gte: ['$createdAt', startOfPreviousMonth] },
										{ $lt: ['$createdAt', startOfMonth] },
									],
								},
								1,
								0,
							],
						},
					},
					previousMonthPaidEnrollments: {
						$sum: {
							$cond: [
								{
									$and: [
										{ $eq: ['$enrollmentType', 'paid'] },
										{ $gte: ['$createdAt', startOfPreviousMonth] },
										{ $lt: ['$createdAt', startOfMonth] },
									],
								},
								1,
								0,
							],
						},
					},
					previousMonthEarned: {
						$sum: {
							$cond: [
								{
									$and: [
										{ $eq: ['$enrollmentType', 'paid'] },
										{ $gte: ['$createdAt', startOfPreviousMonth] },
										{ $lt: ['$createdAt', startOfMonth] },
									],
								},
								{ $ifNull: ['$paidPrice', 0] },
								0,
							],
						},
					},
				},
			},
		])
		: [];
	const statsByCourseId = new Map(enrollmentStats.map((stat) => [String(stat._id), stat]));
	const coursesWithStats = courses.map((course) => {
		const courseObject = course.toObject();
		const stat = statsByCourseId.get(String(course._id));
		const fallbackPrice = course.price ?? 0;
		return {
			...courseObject,
			enrollmentStats: {
				totalEnrollments: stat?.totalEnrollments ?? 0,
				lifetimeEarned: stat?.lifetimeEarned || (stat?.paidEnrollments ?? 0) * fallbackPrice,
				thisMonthCount: stat?.thisMonthCount ?? 0,
				thisMonthEarned: stat?.thisMonthEarned || (stat?.thisMonthPaidEnrollments ?? 0) * fallbackPrice,
				previousMonthCount: stat?.previousMonthCount ?? 0,
				previousMonthEarned: stat?.previousMonthEarned || (stat?.previousMonthPaidEnrollments ?? 0) * fallbackPrice,
			},
		};
	});
	const filteredCourses = coursesWithStats.filter((course) => {
		const stats = course.enrollmentStats;

		if (enrollmentFilter === 'has_lifetime' && stats.totalEnrollments === 0) return false;
		if (enrollmentFilter === 'none_lifetime' && stats.totalEnrollments > 0) return false;
		if (enrollmentFilter === 'has_this_month' && stats.thisMonthCount === 0) return false;
		if (enrollmentFilter === 'none_this_month' && stats.thisMonthCount > 0) return false;
		if (enrollmentFilter === 'has_previous_month' && stats.previousMonthCount === 0) return false;
		if (enrollmentFilter === 'none_previous_month' && stats.previousMonthCount > 0) return false;

		if (earningFilter === 'has_lifetime' && stats.lifetimeEarned <= 0) return false;
		if (earningFilter === 'none_lifetime' && stats.lifetimeEarned > 0) return false;
		if (earningFilter === 'has_this_month' && stats.thisMonthEarned <= 0) return false;
		if (earningFilter === 'none_this_month' && stats.thisMonthEarned > 0) return false;
		if (earningFilter === 'has_previous_month' && stats.previousMonthEarned <= 0) return false;
		if (earningFilter === 'none_previous_month' && stats.previousMonthEarned > 0) return false;

		return true;
	});

	res.status(200).json({ success: true, data: filteredCourses, total: filteredCourses.length });
});

export const browseCourses = asyncHandler(async (req: Request, res: Response) => {
	await expireExpiredCourseDiscounts();
	const { search, courseTypes, categories, subscriptionPlans, pricing, page, limit } = req.query as Record<string, string>;

	// Security: hard-coded — public users only ever see Published + Public courses
	const baseFilter = {
		status: 'Published',
		visibility: 'Public',
	};
	const filter: Record<string, unknown> = {
		...baseFilter,
	};

	if (typeof search === 'string' && search.trim())
		filter.title = { $regex: escapeRegex(search.trim()), $options: 'i' };

	if (courseTypes) {
		const ids = courseTypes.split(',').map((s) => s.trim()).filter((s) => Types.ObjectId.isValid(s)).map((s) => new Types.ObjectId(s));
		if (ids.length > 0) filter.courseType = { $in: ids };
	}

	if (categories) {
		const ids = categories.split(',').map((s) => s.trim()).filter((s) => Types.ObjectId.isValid(s)).map((s) => new Types.ObjectId(s));
		if (ids.length > 0) filter.category = { $in: ids };
	}

	if (pricing) {
		const values = pricing.split(',').map((s) => s.trim()).filter((s) => ['Free', 'Paid'].includes(s));
		if (values.length > 0) filter.pricing = { $in: values };
	}

	if (subscriptionPlans) {
		const plans = subscriptionPlans.split(',').map((s) => s.trim()).filter(Boolean);
		if (plans.length > 0) {
			filter.includedInSubscription = true;
			filter.allowedSubscriptionPlans = { $in: plans };
		}
	}

	const query = Course.find(filter)
		.populate('category', 'name slug')
		.populate('courseType', 'name slug description')
		.populate('teachers', 'name profileImage')
		.populate({
			path: 'sections',
			select: 'lectures order',
			populate: {
				path: 'lectures',
				select: 'title videoUrl isPreview order',
				transform: hideLockedVideo,
			},
		})
		.sort({ createdAt: -1 });

	const [courseTypeCounts, categoryCounts, pricingCounts, subscriptionPlanCounts] = await Promise.all([
		Course.aggregate<{ _id: Types.ObjectId; count: number }>([
			{ $match: baseFilter },
			{ $match: { courseType: { $exists: true, $ne: null } } },
			{ $group: { _id: '$courseType', count: { $sum: 1 } } },
		]),
		Course.aggregate<{ _id: Types.ObjectId; count: number }>([
			{ $match: baseFilter },
			{ $match: { category: { $exists: true, $ne: null } } },
			{ $group: { _id: '$category', count: { $sum: 1 } } },
		]),
		Course.aggregate<{ _id: string; count: number }>([
			{ $match: baseFilter },
			{ $group: { _id: '$pricing', count: { $sum: 1 } } },
		]),
		Course.aggregate<{ _id: SubscriptionPlan; count: number }>([
			{ $match: { ...baseFilter, includedInSubscription: true } },
			{ $unwind: '$allowedSubscriptionPlans' },
			{ $group: { _id: '$allowedSubscriptionPlans', count: { $sum: 1 } } },
		]),
	]);

	const filterCounts = {
		courseTypes: Object.fromEntries(courseTypeCounts.map((item) => [String(item._id), item.count])),
		categories: Object.fromEntries(categoryCounts.map((item) => [String(item._id), item.count])),
		pricing: Object.fromEntries(pricingCounts.map((item) => [item._id, item.count])),
		subscriptionPlans: Object.fromEntries(subscriptionPlanCounts.map((item) => [item._id, item.count])),
	};

	const shouldPaginate = Boolean(page || limit);

	if (!shouldPaginate) {
		const courses = await query;
		res.status(200).json({ success: true, data: courses, total: courses.length, filterCounts });
		return;
	}

	const currentPage = Math.max(Number(page) || 1, 1);
	const perPage = Math.min(Math.max(Number(limit) || 8, 1), 100);
	const total = await Course.countDocuments(filter);
	const totalPages = Math.max(Math.ceil(total / perPage), 1);
	const safePage = Math.min(currentPage, totalPages);

	const courses = await query.skip((safePage - 1) * perPage).limit(perPage);

	res.status(200).json({
		success: true,
		data: courses,
		total,
		filterCounts,
		pagination: {
			page: safePage,
			limit: perPage,
			total,
			totalPages,
			hasNextPage: safePage < totalPages,
			hasPrevPage: safePage > 1,
		},
	});
});

export const getCourseById = asyncHandler(
	async (req: Request, res: Response) => {
		await expireExpiredCourseDiscounts();
		const user = req.user as IUser | undefined;
		// The teachers' linked user accounts are only shown to Super Admin and Admin.
		const teacherFields = user && ['Super Admin', 'Admin'].includes(user.role)
			? 'name bio profileImage expertise socialLinks userId'
			: 'name bio profileImage expertise socialLinks';
		const course = await Course.findById(req.params.id)
			.populate('category', 'name slug')
			.populate('courseType', 'name slug description')
			.populate('teachers', teacherFields)
			.populate({ path: 'sections', populate: { path: 'lectures' } });

		if (!course) throw new AppError('Course not found', 404);

		const teacherIds = (course.populated('teachers') as Types.ObjectId[] | undefined) ?? course.teachers;
		const accessCheck = { _id: course._id, teachers: teacherIds };
		if (course.status !== 'Published' || course.visibility !== 'Public') {
			const canSee = user && (isStaff(user) || (await isCourseTeacher(user, accessCheck)));
			if (!canSee) throw new AppError('Course not found', 404);
		}
		if (!user || !(await canAccessCourseContent(user, accessCheck))) {
			for (const section of course.sections as unknown as { lectures: { isPreview?: boolean; videoUrl?: string }[] }[])
				section.lectures.forEach(hideLockedVideo);
		}
		res.status(200).json({ success: true, data: course });
	},
);

export const getActiveDiscountSummary = asyncHandler(async (_req: Request, res: Response) => {
	await expireExpiredCourseDiscounts();
	const now = new Date();
	const groups = await Course.aggregate<{
		_id: null;
		courseCount: number;
		discountPercent: number;
		discountEndsAt: Date;
		maxListPrice: number;
		minDiscountPrice: number;
	}>([
		{
			$match: {
				status: 'Published',
				visibility: 'Public',
				pricing: 'Paid',
				discountPercent: { $gt: 0 },
				discountEndsAt: { $gt: now },
			},
		},
		{
			$group: {
				_id: null,
				courseCount: { $sum: 1 },
				discountPercent: { $max: '$discountPercent' },
				discountEndsAt: { $min: '$discountEndsAt' },
				maxListPrice: { $max: '$listPrice' },
				minDiscountPrice: { $min: '$discountPrice' },
			},
		},
		{ $limit: 1 },
	]);

	const active = groups[0];
	res.status(200).json({
		success: true,
		data: active
			? {
					courseCount: active.courseCount,
					discountPercent: active.discountPercent,
					discountEndsAt: active.discountEndsAt,
					maxListPrice: active.maxListPrice,
					minDiscountPrice: active.minDiscountPrice,
				}
			: null,
	});
});

export const createCourse = asyncHandler(
	async (req: Request, res: Response) => {
		const body = req.body as {
			title: string;
			subtitle?: string;
			category: string;
			courseType: string;
			startDate?: string;
			endDate?: string;
			teachers?: string;
			visibility?: string;
			pricing?: string;
			price?: string;
			listPrice?: string;
			discountPrice?: string;
			includedInSubscription?: string;
			allowedSubscriptionPlans?: string;
		};

		if (!body.title || !body.category || !body.courseType)
			throw new AppError('Title, category, and course type are required', 400);
		assertCourseEnums(body);
		const category = await assertCatalogRef(body.category, 'category');
		const courseType = await assertCatalogRef(body.courseType, 'courseType');
		const teachers = body.teachers ? await parseTeacherIds(body.teachers) : [];
		const allowedSubscriptionPlans = body.allowedSubscriptionPlans
			? (parseJsonList(body.allowedSubscriptionPlans, 'allowedSubscriptionPlans') as SubscriptionPlan[])
			: [];

		let coverImage: string | undefined;
		let coverImagePublicId: string | undefined;

		if (req.file) {
			const result = await uploadToCloudinary(
				req.file.buffer,
				'medhabee/courses',
			);
			coverImage = result.url;
			coverImagePublicId = result.publicId;
		}

		const pricing = (body.pricing ?? 'Free') as 'Free' | 'Paid';
		const prices = normalizeCoursePrices(
			pricing,
			body.listPrice ? Number(body.listPrice) : body.price ? Number(body.price) : undefined,
			body.discountPrice ? Number(body.discountPrice) : body.price ? Number(body.price) : undefined,
		);

		const course = await Course.create({
			title: body.title,
			subtitle: body.subtitle,
			category,
			courseType,
			startDate: body.startDate ? new Date(body.startDate) : undefined,
			endDate: body.endDate ? new Date(body.endDate) : undefined,
			teachers,
			visibility: (body.visibility ?? 'Private') as 'Public' | 'Private',
			pricing,
			...prices,
			includedInSubscription: body.includedInSubscription === 'true',
			allowedSubscriptionPlans,
			status: 'Draft',
			createdBy: new Types.ObjectId(String(req.user._id)),
			coverImage,
			coverImagePublicId,
		});

		res
			.status(201)
			.json({ success: true, message: 'Course created', data: course });
	},
);

export const updateCourse = asyncHandler(
	async (req: Request, res: Response) => {
		const course = await Course.findById(req.params.id).select('+coverImagePublicId');
		if (!course) throw new AppError('Course not found', 404);

		const body = req.body as Record<string, string>;
		assertCourseEnums(body);
		const category = body.category !== undefined ? await assertCatalogRef(body.category, 'category') : undefined;
		const courseType = body.courseType !== undefined ? await assertCatalogRef(body.courseType, 'courseType') : undefined;
		const teachers = body.teachers ? await parseTeacherIds(body.teachers) : undefined;
		const allowedSubscriptionPlans = body.allowedSubscriptionPlans
			? (parseJsonList(body.allowedSubscriptionPlans, 'allowedSubscriptionPlans') as SubscriptionPlan[])
			: undefined;
		const whatYouWillLearn = body.whatYouWillLearn ? parseJsonList(body.whatYouWillLearn, 'whatYouWillLearn') : undefined;
		const whatYouWillGet = body.whatYouWillGet ? parseJsonList(body.whatYouWillGet, 'whatYouWillGet') : undefined;
		const requirements = body.requirements ? parseJsonList(body.requirements, 'requirements') : undefined;

		if (req.file) {
			if (course.coverImagePublicId)
				await deleteFromCloudinary(course.coverImagePublicId);
			const result = await uploadToCloudinary(
				req.file.buffer,
				'medhabee/courses',
			);
			course.coverImage = result.url;
			course.coverImagePublicId = result.publicId;
		}

		if (body.title !== undefined) course.title = body.title;
		if (body.subtitle !== undefined) course.subtitle = body.subtitle;
		if (body.description !== undefined) course.description = body.description;
		if (category) course.category = category;
		if (courseType) course.courseType = courseType;
		if (body.startDate !== undefined)
			course.startDate = body.startDate ? new Date(body.startDate) : (null as unknown as Date);
		if (body.endDate !== undefined)
			course.endDate = body.endDate ? new Date(body.endDate) : (null as unknown as Date);
		if (body.visibility !== undefined)
			course.visibility = body.visibility as 'Public' | 'Private';
		if (body.pricing !== undefined)
			course.pricing = body.pricing as 'Free' | 'Paid';
		if (
			body.pricing !== undefined ||
			body.price !== undefined ||
			body.listPrice !== undefined ||
			body.discountPrice !== undefined
		) {
			const prices = normalizeCoursePrices(
				course.pricing,
				body.listPrice !== undefined
					? Number(body.listPrice)
					: course.listPrice ?? course.price,
				body.discountPrice !== undefined
					? Number(body.discountPrice)
					: body.price !== undefined
						? Number(body.price)
						: course.discountPrice ?? course.price,
			);
			course.listPrice = prices.listPrice;
			course.discountPrice = prices.discountPrice;
			course.price = prices.price;
		}
		if (body.includedInSubscription !== undefined)
			course.includedInSubscription = body.includedInSubscription === 'true';
		if (teachers) course.teachers = teachers;
		if (allowedSubscriptionPlans) course.allowedSubscriptionPlans = allowedSubscriptionPlans;
		if (whatYouWillLearn) course.whatYouWillLearn = whatYouWillLearn;
		if (whatYouWillGet) course.whatYouWillGet = whatYouWillGet;
		if (requirements) course.requirements = requirements;

		await course.save();
		res
			.status(200)
			.json({ success: true, message: 'Course updated', data: course });
	},
);

export const updateCourseStatus = asyncHandler(
	async (req: Request, res: Response) => {
		const { status } = req.body as { status: CourseStatus };
		if (!['Draft', 'Published'].includes(status))
			throw new AppError('Invalid status', 400);

		const course = await Course.findByIdAndUpdate(
			req.params.id,
			{
				status,
				publishedAt: status === 'Published' ? new Date() : null,
			},
			{ new: true },
		);
		if (!course) throw new AppError('Course not found', 404);

		res
			.status(200)
			.json({
				success: true,
				message: `Course ${status.toLowerCase()}`,
				data: course,
			});
	},
);

export const deleteCourse = asyncHandler(
	async (req: Request, res: Response) => {
		const course = await Course.findById(req.params.id).select('+coverImagePublicId');
		if (!course) throw new AppError('Course not found', 404);
		// Enrolments are revenue and learning history (dashboard, reports): never delete them with the course.
		const enrollmentCount = await Enrollment.countDocuments({ course: course._id });
		if (enrollmentCount > 0)
			throw new AppError(`This course has ${enrollmentCount} enrolment(s); unpublish it instead of deleting`, 400);

		if (course.coverImagePublicId)
			await deleteFromCloudinary(course.coverImagePublicId);
		await Lecture.deleteMany({ section: { $in: course.sections } });
		await Section.deleteMany({ course: course._id });
		await StudyCurriculum.deleteMany({ course: course._id });
		const questionIds = await Question.find({ course: course._id }).distinct('_id');
		await Promise.all([
			Answer.deleteMany({ question: { $in: questionIds } }),
			Question.deleteMany({ course: course._id }),
			Announcement.deleteMany({ course: course._id }),
			StudyMaterial.deleteMany({ course: course._id }),
			QuizSection.deleteMany({ course: course._id }),
			QuizBank.deleteMany({ course: course._id }),
			QuizAttempt.deleteMany({ course: course._id }),
		]);
		await course.deleteOne();

		res.status(200).json({ success: true, message: 'Course deleted' });
	},
);

export const bulkUpdateCourses = asyncHandler(
	async (req: Request, res: Response) => {
		const body = req.body as {
			courseIds: string[];
			updates?: {
				courseType?: string | null;
				category?: string;
				startDate?: string | null;
				endDate?: string | null;
				status?: string;
				visibility?: string;
				pricing?: string;
				price?: number | null;
				includedInSubscription?: boolean;
				allowedSubscriptionPlans?: SubscriptionPlan[];
				teachers?: string[];
			};
			announcement?: { title: string; description: string };
		};

		const { courseIds, updates, announcement } = body;

		if (!Array.isArray(courseIds) || courseIds.length === 0)
			throw new AppError('courseIds must be a non-empty array', 400);

		if (!updates && !announcement)
			throw new AppError('Provide at least one field to update or an announcement', 400);

		const invalidId = courseIds.find((id) => typeof id !== 'string' || !Types.ObjectId.isValid(id));
		if (invalidId !== undefined) throw new AppError(`Invalid course ID: ${String(invalidId)}`, 400);

		// ── Validate everything before any write (all or nothing) ──────
		if (announcement !== undefined) {
			if (typeof announcement !== 'object' || announcement === null)
				throw new AppError('Announcement title is required', 400);
			const { title, description } = announcement;
			if (typeof title !== 'string' || !title.trim()) throw new AppError('Announcement title is required', 400);
			if (typeof description !== 'string' || !description.trim())
				throw new AppError('Announcement description is required', 400);
		}

		const $set: Record<string, unknown> = {};
		// A price sent without a pricing change only applies to the Paid courses.
		const paidOnlySet: Record<string, unknown> = {};

		if (updates !== undefined) {
			if (typeof updates !== 'object' || updates === null || Array.isArray(updates))
				throw new AppError('Updates must be an object', 400);

			if ('courseType' in updates) {
				if (updates.courseType && (typeof updates.courseType !== 'string' || !Types.ObjectId.isValid(updates.courseType)))
					throw new AppError('Invalid course type ID', 400);
				$set.courseType = updates.courseType ? new Types.ObjectId(updates.courseType) : null;
			}
			if ('category' in updates) {
				if (typeof updates.category !== 'string' || !Types.ObjectId.isValid(updates.category))
					throw new AppError('Invalid category ID', 400);
				$set.category = new Types.ObjectId(updates.category);
			}
			if ('startDate' in updates)
				$set.startDate = updates.startDate ? new Date(updates.startDate) : null;
			if ('endDate' in updates)
				$set.endDate = updates.endDate ? new Date(updates.endDate) : null;
			if ('status' in updates) {
				if (!['Draft', 'Published'].includes(updates.status as string))
					throw new AppError('Status must be Draft or Published', 400);
				$set.status = updates.status;
				$set.publishedAt = updates.status === 'Published' ? new Date() : null;
			}
			if ('visibility' in updates) {
				if (!COURSE_VISIBILITIES.includes(updates.visibility as string))
					throw new AppError('Visibility must be Public or Private', 400);
				$set.visibility = updates.visibility;
			}
			const { price } = updates;
			if (price != null && (typeof price !== 'number' || !Number.isFinite(price) || price < 0))
				throw new AppError('Price must be a number of 0 or more', 400);
			if ('pricing' in updates) {
				if (!COURSE_PRICINGS.includes(updates.pricing as string))
					throw new AppError('Pricing must be Free or Paid', 400);
				if (updates.pricing === 'Paid' && price == null)
					throw new AppError('Price is required when pricing is Paid', 400);
				$set.pricing = updates.pricing;
				// Same rule as the single update: Free zeroes the prices, Paid sets them together.
				const finalPrice = updates.pricing === 'Paid' ? price : 0;
				Object.assign($set, { price: finalPrice, listPrice: finalPrice, discountPrice: finalPrice });
			} else if (price != null) {
				Object.assign(paidOnlySet, { price, listPrice: price, discountPrice: price });
			}
			if ('includedInSubscription' in updates) {
				if (typeof updates.includedInSubscription !== 'boolean')
					throw new AppError('includedInSubscription must be true or false', 400);
				$set.includedInSubscription = updates.includedInSubscription;
			}
			if ('allowedSubscriptionPlans' in updates) {
				const plans: unknown = updates.allowedSubscriptionPlans;
				if (!Array.isArray(plans) || plans.some((plan) => typeof plan !== 'string'))
					throw new AppError('allowedSubscriptionPlans must be a list of plan names', 400);
				$set.allowedSubscriptionPlans = plans;
			}
			if ('teachers' in updates) {
				const teacherIds: unknown = updates.teachers ?? [];
				if (!Array.isArray(teacherIds)) throw new AppError('teachers must be a list of teacher IDs', 400);
				const invalidTeacher: unknown = teacherIds.find(
					(id) => typeof id !== 'string' || !Types.ObjectId.isValid(id),
				);
				if (invalidTeacher !== undefined) throw new AppError(`Invalid teacher ID: ${String(invalidTeacher)}`, 400);
				$set.teachers = (teacherIds as string[]).map((id) => new Types.ObjectId(id));
			}
		}

		const objectIds = courseIds.map((id) => new Types.ObjectId(id));

		// Verify all courses exist
		const found = await Course.countDocuments({ _id: { $in: objectIds } });
		if (found !== courseIds.length)
			throw new AppError('One or more courses were not found', 404);

		// ── Field updates ──────────────────────────────────────────────
		if (Object.keys($set).length > 0)
			await Course.updateMany({ _id: { $in: objectIds } }, { $set });
		if (Object.keys(paidOnlySet).length > 0)
			await Course.updateMany({ _id: { $in: objectIds }, pricing: 'Paid' }, { $set: paidOnlySet });

		// ── Bulk announcement ──────────────────────────────────────────
		if (announcement) {
			const { title, description } = announcement;
			await Announcement.insertMany(
				objectIds.map((courseId) => ({
					course: courseId,
					title: title.trim(),
					description: description.trim(),
					postedBy: req.user._id,
				})),
			);
		}

		res.status(200).json({
			success: true,
			message: `Successfully updated ${courseIds.length} course${courseIds.length !== 1 ? 's' : ''}`,
			updatedCount: courseIds.length,
		});
	},
);

export const bulkApplyCourseDiscount = asyncHandler(async (req: Request, res: Response) => {
	const body = req.body as {
		courseIds: string[];
		discountPercent: number;
		discountEndsAt: string;
	};
	const { courseIds, discountPercent, discountEndsAt } = body;

	if (!Array.isArray(courseIds) || courseIds.length === 0)
		throw new AppError('courseIds must be a non-empty array', 400);

	const invalidId = courseIds.find((id) => !Types.ObjectId.isValid(id));
	if (invalidId) throw new AppError(`Invalid course ID: ${invalidId}`, 400);

	const percent = Number(discountPercent);
	if (!Number.isFinite(percent) || percent <= 0 || percent >= 100)
		throw new AppError('Discount percentage must be between 1 and 99', 400);

	const endsAt = new Date(discountEndsAt);
	if (Number.isNaN(endsAt.getTime()) || endsAt <= new Date())
		throw new AppError('Discount end date and time must be in the future', 400);

	const objectIds = courseIds.map((id) => new Types.ObjectId(id));
	const courses = await Course.find({ _id: { $in: objectIds } }).select(
		'price listPrice pricing',
	);

	if (courses.length !== courseIds.length)
		throw new AppError('One or more courses were not found', 404);

	const writes = courses.map((course) => {
		const listPrice = Math.max(course.listPrice ?? course.price ?? 0, 0);
		if (listPrice <= 0) {
			throw new AppError('All selected courses must have a positive list price', 400);
		}
		const discountPrice = Math.round(listPrice * (1 - percent / 100) * 100) / 100;
		return {
			updateOne: {
				filter: { _id: course._id },
				update: {
					$set: {
						pricing: 'Paid' as const,
						listPrice,
						discountPrice,
						price: discountPrice,
						discountPercent: percent,
						discountEndsAt: endsAt,
					},
				},
			},
		};
	});

	if (writes.length > 0) await Course.bulkWrite(writes);

	res.status(200).json({
		success: true,
		message: `Discount applied to ${writes.length} course${writes.length !== 1 ? 's' : ''}`,
		updatedCount: writes.length,
		data: {
			courseCount: writes.length,
			discountPercent: percent,
			discountEndsAt: endsAt,
		},
	});
});
