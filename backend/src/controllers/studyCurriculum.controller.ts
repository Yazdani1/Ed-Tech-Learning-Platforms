import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Course } from '../models/Course.model';
import { StudyCurriculum } from '../models/StudyCurriculum.model';
import { Teacher } from '../models/Teacher.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

type CurriculumLectureInput = {
	title?: string;
	description?: string;
	day?: string;
	time?: string;
};

type CurriculumInput = {
	title?: string;
	description?: string;
	weekName?: string;
	lectures?: CurriculumLectureInput[];
};

const adminRoles = ['Super Admin', 'Admin', 'Moderator'];

const assertTeacherAssigned = async (courseId: string, userId: Types.ObjectId) => {
	const course = await Course.findById(courseId);
	if (!course) throw new AppError('Course not found', 404);

	const teacherProfile = await Teacher.findOne({ userId });
	if (!teacherProfile) throw new AppError('No teacher profile is linked to your account', 403);

	const isAssigned = course.teachers.some(
		(t) => t.toString() === (teacherProfile._id as Types.ObjectId).toString(),
	);
	if (!isAssigned) throw new AppError('You are not assigned to this course', 403);
};

const normalizeLectures = (lectures: CurriculumLectureInput[] = []) =>
	lectures.map((lecture) => {
		if (!lecture.title?.trim()) throw new AppError('Lecture title is required', 400);
		if (!lecture.day?.trim()) throw new AppError('Lecture day is required', 400);
		if (!lecture.time?.trim()) throw new AppError('Lecture time is required', 400);

		return {
			title: lecture.title.trim(),
			description: lecture.description?.trim() ?? '',
			day: lecture.day.trim(),
			time: lecture.time.trim(),
		};
	});

export const getCourseStudyCurricula = asyncHandler(async (req: Request, res: Response) => {
	const curricula = await StudyCurriculum.find({ course: req.params.courseId })
		.populate('postedBy', 'name avatar role')
		.sort({ createdAt: 1 });

	res.status(200).json({ success: true, data: curricula, total: curricula.length });
});

export const createStudyCurriculum = asyncHandler(async (req: Request, res: Response) => {
	const { title, description, weekName, lectures } = req.body as CurriculumInput;
	const courseId = req.params.courseId as string;

	if (!title?.trim()) throw new AppError('Title is required', 400);
	if (!description?.trim()) throw new AppError('Description is required', 400);
	if (!weekName?.trim()) throw new AppError('Week name is required', 400);

	const course = await Course.findById(courseId);
	if (!course) throw new AppError('Course not found', 404);

	if (req.user.role === 'Teacher') {
		await assertTeacherAssigned(courseId, req.user._id as Types.ObjectId);
	}

	const curriculum = await StudyCurriculum.create({
		course: new Types.ObjectId(courseId),
		title: title.trim(),
		description: description.trim(),
		weekName: weekName.trim(),
		lectures: normalizeLectures(lectures),
		postedBy: req.user._id,
	});

	const populated = await curriculum.populate('postedBy', 'name avatar role');
	res.status(201).json({ success: true, message: 'Live class added', data: populated });
});

export const updateStudyCurriculum = asyncHandler(async (req: Request, res: Response) => {
	const { title, description, weekName, lectures } = req.body as CurriculumInput;
	const curriculum = await StudyCurriculum.findById(req.params.id);
	if (!curriculum) throw new AppError('Live class not found', 404);

	const isOwner = curriculum.postedBy.toString() === (req.user._id as Types.ObjectId).toString();
	const isAdmin = adminRoles.includes(req.user.role);
	if (!isOwner && !isAdmin) throw new AppError('Not authorized to update this live class', 403);

	if (!title?.trim()) throw new AppError('Title is required', 400);
	if (!description?.trim()) throw new AppError('Description is required', 400);
	if (!weekName?.trim()) throw new AppError('Week name is required', 400);

	curriculum.title = title.trim();
	curriculum.description = description.trim();
	curriculum.weekName = weekName.trim();
	curriculum.lectures = normalizeLectures(lectures);
	await curriculum.save();

	const populated = await curriculum.populate('postedBy', 'name avatar role');
	res.status(200).json({ success: true, message: 'Live class updated', data: populated });
});

export const deleteStudyCurriculum = asyncHandler(async (req: Request, res: Response) => {
	const curriculum = await StudyCurriculum.findById(req.params.id);
	if (!curriculum) throw new AppError('Live class not found', 404);

	const isOwner = curriculum.postedBy.toString() === (req.user._id as Types.ObjectId).toString();
	const isAdmin = adminRoles.includes(req.user.role);
	if (!isOwner && !isAdmin) throw new AppError('Not authorized to delete this live class', 403);

	await curriculum.deleteOne();
	res.status(200).json({ success: true, message: 'Live class deleted' });
});

