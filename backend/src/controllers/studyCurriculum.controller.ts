import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Course } from '../models/Course.model';
import { StudyCurriculum } from '../models/StudyCurriculum.model';
import { Teacher } from '../models/Teacher.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { canAccessCourseContent, isCourseTeacher } from '../utils/courseAccess';
import type { IUser } from '../models/User.model';

/** A Teacher who posted the item must still be a teacher of its course to change or delete it. */
const isCourseTeacherOf = async (user: IUser, courseId: Types.ObjectId): Promise<boolean> => {
	const course = await Course.findById(courseId).select('teachers');
	return Boolean(course && (await isCourseTeacher(user, course)));
};

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

const isText = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';

const normalizeLectures = (lectures: unknown = []) => {
	if (!Array.isArray(lectures)) throw new AppError('Lectures must be a list', 400);

	return (lectures as unknown[]).map((item) => {
		const lecture = (item ?? {}) as CurriculumLectureInput;
		if (!isText(lecture.title)) throw new AppError('Lecture title is required', 400);
		if (!isText(lecture.day)) throw new AppError('Lecture day is required', 400);
		if (!isText(lecture.time)) throw new AppError('Lecture time is required', 400);
		if (lecture.description !== undefined && typeof lecture.description !== 'string') {
			throw new AppError('Lecture description must be text', 400);
		}

		return {
			title: lecture.title.trim(),
			description: lecture.description?.trim() ?? '',
			day: lecture.day.trim(),
			time: lecture.time.trim(),
		};
	});
};

// Fields everyone may see (the public course page shows the live-class schedule). Anything else, such as a
// future meeting or recording link, is only for users with access to the course content.
const PUBLIC_CURRICULUM_FIELDS =
	'course title description weekName lectures._id lectures.title lectures.description lectures.day lectures.time createdAt updatedAt';

export const getCourseStudyCurricula = asyncHandler(async (req: Request, res: Response) => {
	const courseId = req.params.courseId;
	if (typeof courseId !== 'string' || !Types.ObjectId.isValid(courseId)) {
		throw new AppError('Invalid course id', 400);
	}
	const course = await Course.findById(courseId).select('teachers');
	if (!course) throw new AppError('Course not found', 404);

	const viewer = req.user as IUser | undefined;
	if (viewer && (await canAccessCourseContent(viewer, course))) {
		const curricula = await StudyCurriculum.find({ course: courseId })
			.populate('postedBy', 'name avatar role')
			.sort({ createdAt: 1 });
		res.status(200).json({ success: true, data: curricula, total: curricula.length });
		return;
	}

	const curricula = await StudyCurriculum.find({ course: courseId })
		.select(PUBLIC_CURRICULUM_FIELDS)
		.sort({ createdAt: 1 })
		.lean();
	res.status(200).json({ success: true, data: curricula, total: curricula.length });
});

export const createStudyCurriculum = asyncHandler(async (req: Request, res: Response) => {
	const { title, description, weekName, lectures } = req.body as CurriculumInput;
	const courseId = req.params.courseId as string;

	if (!isText(title)) throw new AppError('Title is required', 400);
	if (!isText(description)) throw new AppError('Description is required', 400);
	if (!isText(weekName)) throw new AppError('Week name is required', 400);

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
	if (!isAdmin && !(await isCourseTeacherOf(req.user, curriculum.course))) throw new AppError('You are no longer a teacher of this course', 403);

	if (!isText(title)) throw new AppError('Title is required', 400);
	if (!isText(description)) throw new AppError('Description is required', 400);
	if (!isText(weekName)) throw new AppError('Week name is required', 400);

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
	if (!isAdmin && !(await isCourseTeacherOf(req.user, curriculum.course))) throw new AppError('You are no longer a teacher of this course', 403);

	await curriculum.deleteOne();
	res.status(200).json({ success: true, message: 'Live class deleted' });
});

