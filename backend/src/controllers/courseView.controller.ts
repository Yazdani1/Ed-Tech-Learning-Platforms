import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Course } from '../models/Course.model';
import { CourseView } from '../models/CourseView.model';
import type { IUser } from '../models/User.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { ensureVisitorCookie, visitorFromCookie } from '../utils/visitorCookie';

const DUPLICATE_KEY = 11000;

/**
 * The visitor: a signed-in user by id, a guest by the anonymous `vid` cookie. A guest without the cookie only
 * gets one (null: not counted), so requests that never send cookies back cannot inflate the count.
 */
const visitorOf = (req: Request, res: Response): string | null => {
	const user = req.user as IUser | undefined;
	if (user) return `u:${String(user._id)}`;
	const guest = visitorFromCookie(req);
	if (guest) return `g:${guest}`;
	ensureVisitorCookie(req, res);
	return null;
};

/**
 * POST /api/courses/:id/view: counts a visit of a published public course page, once per visitor per UTC day.
 * Always answers 200 with whether this visit was counted (a repeat the same day is not). Guests get their
 * cookie with GET /api/courses/:id; one without it is not counted.
 */
export const recordCourseView = asyncHandler(async (req: Request, res: Response) => {
	const courseId = String(req.params.id);
	if (!Types.ObjectId.isValid(courseId)) throw new AppError('Invalid course id', 400);
	const course = await Course.findOne({ _id: courseId, status: 'Published', visibility: 'Public' }).select('_id').lean();
	if (!course) throw new AppError('Course not found', 404);

	const visitor = visitorOf(req, res);
	if (!visitor) {
		res.status(200).json({ success: true, data: { counted: false } });
		return;
	}
	const day = new Date().toISOString().slice(0, 10);
	let counted = true;
	try {
		await CourseView.create({ course: course._id, visitor, day });
	} catch (err) {
		if ((err as { code?: number }).code !== DUPLICATE_KEY) throw err;
		counted = false;
	}
	if (counted) await Course.updateOne({ _id: course._id }, { $inc: { viewCount: 1 } });
	res.status(200).json({ success: true, data: { counted } });
});
