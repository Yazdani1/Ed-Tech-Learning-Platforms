import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Announcement } from '../models/Announcement.model';
import { AnnouncementBroadcast } from '../models/AnnouncementBroadcast.model';
import { AnnouncementView } from '../models/AnnouncementView.model';
import { Course } from '../models/Course.model';
import { Enrollment } from '../models/Enrollment.model';
import { deleteFromCloudinary, uploadToCloudinary } from '../config/cloudinary';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

const TITLE_MAX = 200;
const DESCRIPTION_MAX = 20000;
const MAX_COURSES = 500;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const isText = (value: unknown, max: number): value is string =>
	typeof value === 'string' && value.trim() !== '' && value.trim().length <= max;

/** The courses from the multipart body (a JSON list): published courses only, at least one. */
const parseCourseIds = async (value: unknown): Promise<Types.ObjectId[]> => {
	let ids: unknown;
	try {
		ids = typeof value === 'string' ? JSON.parse(value) : value;
	} catch {
		throw new AppError('Invalid course list', 400);
	}
	if (!Array.isArray(ids) || ids.length === 0) throw new AppError('Select at least one course', 400);
	if (ids.length > MAX_COURSES) throw new AppError(`At most ${MAX_COURSES} courses at once`, 400);
	if (ids.some((id) => typeof id !== 'string' || !Types.ObjectId.isValid(id))) throw new AppError('Invalid course id', 400);
	const unique = [...new Set(ids as string[])].map((id) => new Types.ObjectId(id));
	const published = await Course.countDocuments({ _id: { $in: unique }, status: 'Published' });
	if (published !== unique.length) throw new AppError('Announcements can only be sent to published courses', 400);
	return unique;
};

/** Distinct students who saw each broadcast (any of its courses). */
const seenCounts = async (ids: Types.ObjectId[]): Promise<Map<string, number>> => {
	const rows = await AnnouncementView.aggregate<{ _id: Types.ObjectId; count: number }>([
		{ $match: { broadcast: { $in: ids } } },
		{ $group: { _id: { broadcast: '$broadcast', student: '$student' } } },
		{ $group: { _id: '$_id.broadcast', count: { $sum: 1 } } },
	]);
	return new Map(rows.map((row) => [String(row._id), row.count]));
};

/** GET /api/announcements/broadcasts?page&limit: the sent announcements, newest first, with "seen by" counts. */
export const getBroadcasts = asyncHandler(async (req: Request, res: Response) => {
	const page = Math.max(Number(req.query.page) || 1, 1);
	const limit = Math.min(Math.max(Number(req.query.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
	const [items, total] = await Promise.all([
		AnnouncementBroadcast.find()
			.sort({ createdAt: -1 })
			.skip((page - 1) * limit)
			.limit(limit)
			.populate('postedBy', 'name avatar role')
			.lean(),
		AnnouncementBroadcast.countDocuments(),
	]);
	const seen = await seenCounts(items.map((item) => item._id));
	const data = items.map((item) => ({
		...item,
		courseCount: item.courses.length,
		seenCount: seen.get(String(item._id)) ?? 0,
	}));
	res.status(200).json({ success: true, data, total, page, limit });
});

/** GET /api/announcements/broadcasts/:id: full details, its courses (with student and seen counts) and who posted. */
export const getBroadcastById = asyncHandler(async (req: Request, res: Response) => {
	const id = String(req.params.id);
	if (!Types.ObjectId.isValid(id)) throw new AppError('Invalid announcement id', 400);
	const item = await AnnouncementBroadcast.findById(id)
		.populate('postedBy', 'name avatar role')
		.populate('courses', 'title coverImage batchNumber status')
		.lean();
	if (!item) throw new AppError('Announcement not found', 404);
	const courseIds = (item.courses as unknown as { _id: Types.ObjectId }[]).map((course) => course._id);
	const [students, views, seen] = await Promise.all([
		Enrollment.aggregate<{ _id: Types.ObjectId; count: number }>([
			{ $match: { course: { $in: courseIds } } },
			{ $group: { _id: '$course', count: { $sum: 1 } } },
		]),
		AnnouncementView.aggregate<{ _id: Types.ObjectId; count: number }>([
			{ $match: { broadcast: item._id } },
			{ $lookup: { from: 'announcements', localField: 'announcement', foreignField: '_id', as: 'a' } },
			{ $unwind: '$a' },
			{ $group: { _id: '$a.course', count: { $sum: 1 } } },
		]),
		seenCounts([item._id]),
	]);
	const studentsBy = new Map(students.map((row) => [String(row._id), row.count]));
	const viewsBy = new Map(views.map((row) => [String(row._id), row.count]));
	const courses = (item.courses as unknown as { _id: Types.ObjectId }[]).map((course) => ({
		...course,
		studentCount: studentsBy.get(String(course._id)) ?? 0,
		seenCount: viewsBy.get(String(course._id)) ?? 0,
	}));
	res.status(200).json({
		success: true,
		data: { ...item, courses, courseCount: courses.length, seenCount: seen.get(String(item._id)) ?? 0 },
	});
});

/**
 * POST /api/announcements/broadcasts (multipart: title, description (rich text), courseIds (JSON list),
 * optional image): one announcement in each selected published course.
 */
export const createBroadcast = asyncHandler(async (req: Request, res: Response) => {
	const body = req.body as Record<string, unknown>;
	if (!isText(body.title, TITLE_MAX)) throw new AppError(`Title is required (at most ${TITLE_MAX} characters)`, 400);
	if (!isText(body.description, DESCRIPTION_MAX)) throw new AppError('Description is required', 400);
	const courses = await parseCourseIds(body.courseIds);
	const image = req.file ? await uploadToCloudinary(req.file.buffer, 'medhabee/announcements') : undefined;

	const title = body.title.trim();
	const description = body.description.trim();
	const broadcast = new AnnouncementBroadcast({
		title,
		description,
		image: image ? { url: image.url, publicId: image.publicId } : undefined,
		courses,
		postedBy: req.user._id,
	});
	try {
		await broadcast.save();
		await Announcement.insertMany(
			courses.map((course) => ({
				course,
				title,
				description,
				postedBy: req.user._id,
				broadcast: broadcast._id,
				image: image ? { url: image.url } : undefined,
			})),
		);
	} catch (err) {
		// No orphan picture in Cloudinary (or half-sent broadcast) when the announcement could not be saved
		if (image) await deleteFromCloudinary(image.publicId);
		await AnnouncementBroadcast.deleteOne({ _id: broadcast._id });
		throw err;
	}
	res.status(201).json({
		success: true,
		message: `Announcement sent to ${courses.length} course${courses.length === 1 ? '' : 's'}`,
		data: {
			...broadcast.toObject(),
			image: image ? { url: image.url } : undefined,
			courseCount: courses.length,
			seenCount: 0,
		},
	});
});
