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

