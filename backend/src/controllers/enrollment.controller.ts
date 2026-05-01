import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Course } from '../models/Course.model';
import { Enrollment } from '../models/Enrollment.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

export const enroll = asyncHandler(async (req: Request, res: Response) => {
	const courseId = String(req.params.courseId);
	const studentId = String(req.user._id);

	const course = await Course.findById(courseId);
	if (!course) throw new AppError('Course not found', 404);
	if (course.status !== 'Published')
		throw new AppError('This course is not available for enrollment', 400);

	const existing = await Enrollment.findOne({
		student: studentId,
		course: courseId,
	});
	if (existing) throw new AppError('Already enrolled in this course', 400);

	await Enrollment.create({
		student: new Types.ObjectId(studentId),
		course: new Types.ObjectId(courseId),
	});

	res.status(201).json({ success: true, message: 'Enrolled successfully' });
});

export const getMyEnrollments = asyncHandler(
	async (req: Request, res: Response) => {
		const enrollments = await Enrollment.find({ student: String(req.user._id) })
			.populate({
				path: 'course',
				populate: [
					{ path: 'category', select: 'name slug' },
					{ path: 'teachers', select: 'name profileImage' },
				],
			})
			.sort({ createdAt: -1 });

		const courses = enrollments
			.map((e) => e.course)
			.filter((course): course is NonNullable<typeof course> =>
				Boolean(course),
			);

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

		res.status(200).json({ success: true, data: { isEnrolled: !!enrollment } });
	},
);
