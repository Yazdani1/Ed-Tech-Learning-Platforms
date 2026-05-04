import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Course } from '../models/Course.model';
import { Section } from '../models/Section.model';
import { Lecture } from '../models/Lecture.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary';
import type { CourseStatus, SubscriptionPlan } from '../types/index';

export const getCourses = asyncHandler(async (req: Request, res: Response) => {
	const { category, status, pricing, visibility, search } = req.query as Record<string, string>;

	const filter: Record<string, unknown> = {};
	if (category) filter.category = category;
	if (status) filter.status = status;
	if (pricing) filter.pricing = pricing;
	if (visibility) filter.visibility = visibility;
	if (search) filter.title = { $regex: search, $options: 'i' };

	const courses = await Course.find(filter)
		.populate('category', 'name slug')
		.populate('courseType', 'name slug description')
		.populate('teachers', 'name profileImage')
		.sort({ createdAt: -1 });

	res.status(200).json({ success: true, data: courses, total: courses.length });
});

export const browseCourses = asyncHandler(async (req: Request, res: Response) => {
	const { search, courseTypes, categories, subscriptionPlans, page, limit } = req.query as Record<string, string>;

	// Security: hard-coded — public users only ever see Published + Public courses
	const filter: Record<string, unknown> = {
		status: 'Published',
		visibility: 'Public',
	};

	if (search?.trim())
		filter.title = { $regex: search.trim(), $options: 'i' };

	if (courseTypes) {
		const ids = courseTypes.split(',').map((s) => s.trim()).filter((s) => Types.ObjectId.isValid(s)).map((s) => new Types.ObjectId(s));
		if (ids.length > 0) filter.courseType = { $in: ids };
	}

	if (categories) {
		const ids = categories.split(',').map((s) => s.trim()).filter((s) => Types.ObjectId.isValid(s)).map((s) => new Types.ObjectId(s));
		if (ids.length > 0) filter.category = { $in: ids };
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
			},
		})
		.sort({ createdAt: -1 });

	const shouldPaginate = Boolean(page || limit);

	if (!shouldPaginate) {
		const courses = await query;
		res.status(200).json({ success: true, data: courses, total: courses.length });
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
		const course = await Course.findById(req.params.id)
			.populate('category', 'name slug')
			.populate('courseType', 'name slug description')
			.populate('teachers', 'name bio profileImage expertise socialLinks userId')
			.populate({ path: 'sections', populate: { path: 'lectures' } });

		if (!course) throw new AppError('Course not found', 404);
		res.status(200).json({ success: true, data: course });
	},
);

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
			includedInSubscription?: string;
			allowedSubscriptionPlans?: string;
		};

		if (!body.title || !body.category || !body.courseType)
			throw new AppError('Title, category, and course type are required', 400);

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

		const course = await Course.create({
			title: body.title,
			subtitle: body.subtitle,
			category: new Types.ObjectId(body.category),
			courseType: new Types.ObjectId(body.courseType),
			startDate: body.startDate ? new Date(body.startDate) : undefined,
			endDate: body.endDate ? new Date(body.endDate) : undefined,
			teachers: body.teachers
				? (JSON.parse(body.teachers) as string[]).map(
						(id) => new Types.ObjectId(id),
					)
				: [],
			visibility: (body.visibility ?? 'Private') as 'Public' | 'Private',
			pricing: (body.pricing ?? 'Free') as 'Free' | 'Paid',
			price: body.price ? Number(body.price) : undefined,
			includedInSubscription: body.includedInSubscription === 'true',
			allowedSubscriptionPlans: body.allowedSubscriptionPlans
				? (JSON.parse(body.allowedSubscriptionPlans) as SubscriptionPlan[])
				: [],
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
		const course = await Course.findById(req.params.id);
		if (!course) throw new AppError('Course not found', 404);

		const body = req.body as Record<string, string>;

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
		if (body.category !== undefined)
			course.category = new Types.ObjectId(body.category);
		if (body.courseType !== undefined)
			course.courseType = new Types.ObjectId(body.courseType);
		if (body.startDate !== undefined)
			course.startDate = body.startDate ? new Date(body.startDate) : (null as unknown as Date);
		if (body.endDate !== undefined)
			course.endDate = body.endDate ? new Date(body.endDate) : (null as unknown as Date);
		if (body.visibility !== undefined)
			course.visibility = body.visibility as 'Public' | 'Private';
		if (body.pricing !== undefined)
			course.pricing = body.pricing as 'Free' | 'Paid';
		if (body.price !== undefined) course.price = Number(body.price);
		if (body.includedInSubscription !== undefined)
			course.includedInSubscription = body.includedInSubscription === 'true';
		if (body.teachers)
			course.teachers = (JSON.parse(body.teachers) as string[]).map(
				(id) => new Types.ObjectId(id),
			);
		if (body.allowedSubscriptionPlans)
			course.allowedSubscriptionPlans = JSON.parse(
				body.allowedSubscriptionPlans,
			) as SubscriptionPlan[];
		if (body.whatYouWillLearn)
			course.whatYouWillLearn = JSON.parse(body.whatYouWillLearn) as string[];
		if (body.whatYouWillGet)
			course.whatYouWillGet = JSON.parse(body.whatYouWillGet) as string[];
		if (body.requirements)
			course.requirements = JSON.parse(body.requirements) as string[];

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
			{ status },
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
		const course = await Course.findById(req.params.id);
		if (!course) throw new AppError('Course not found', 404);

		if (course.coverImagePublicId)
			await deleteFromCloudinary(course.coverImagePublicId);
		await Lecture.deleteMany({ section: { $in: course.sections } });
		await Section.deleteMany({ course: course._id });
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

		const invalidId = courseIds.find((id) => !Types.ObjectId.isValid(id));
		if (invalidId) throw new AppError(`Invalid course ID: ${invalidId}`, 400);

		const objectIds = courseIds.map((id) => new Types.ObjectId(id));

		// Verify all courses exist
		const found = await Course.countDocuments({ _id: { $in: objectIds } });
		if (found !== courseIds.length)
			throw new AppError('One or more courses were not found', 404);

		// ── Field updates ──────────────────────────────────────────────
		if (updates && Object.keys(updates).length > 0) {
			const $set: Record<string, unknown> = {};

			if ('courseType' in updates)
				$set.courseType = updates.courseType ? new Types.ObjectId(updates.courseType) : null;
			if ('category' in updates) {
				if (!Types.ObjectId.isValid(updates.category!))
					throw new AppError('Invalid category ID', 400);
				$set.category = new Types.ObjectId(updates.category!);
			}
			if ('startDate' in updates)
				$set.startDate = updates.startDate ? new Date(updates.startDate) : null;
			if ('endDate' in updates)
				$set.endDate = updates.endDate ? new Date(updates.endDate) : null;
			if ('visibility' in updates) {
				if (!['Public', 'Private'].includes(updates.visibility!))
					throw new AppError('Visibility must be Public or Private', 400);
				$set.visibility = updates.visibility;
			}
			if ('pricing' in updates) {
				if (!['Free', 'Paid'].includes(updates.pricing!))
					throw new AppError('Pricing must be Free or Paid', 400);
				$set.pricing = updates.pricing;
				if (updates.pricing === 'Paid' && updates.price == null)
					throw new AppError('Price is required when pricing is Paid', 400);
			}
			if ('price' in updates) $set.price = updates.price;
			if ('includedInSubscription' in updates)
				$set.includedInSubscription = updates.includedInSubscription;
			if ('allowedSubscriptionPlans' in updates)
				$set.allowedSubscriptionPlans = updates.allowedSubscriptionPlans;
			if ('teachers' in updates) {
				const invalidTeacher = (updates.teachers ?? []).find(
					(id) => !Types.ObjectId.isValid(id),
				);
				if (invalidTeacher) throw new AppError(`Invalid teacher ID: ${invalidTeacher}`, 400);
				$set.teachers = (updates.teachers ?? []).map((id) => new Types.ObjectId(id));
			}

			if (Object.keys($set).length > 0)
				await Course.updateMany({ _id: { $in: objectIds } }, { $set });
		}

		// ── Bulk announcement ──────────────────────────────────────────
		if (announcement) {
			const { title, description } = announcement;
			if (!title?.trim()) throw new AppError('Announcement title is required', 400);
			if (!description?.trim()) throw new AppError('Announcement description is required', 400);

			const { Announcement } = await import('../models/Announcement.model');
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
