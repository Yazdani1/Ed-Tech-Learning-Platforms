import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Announcement } from '../models/Announcement.model';
import { Course } from '../models/Course.model';
import { Teacher } from '../models/Teacher.model';
import { AppError } from '../utils/AppError';
import type { IUser } from '../models/User.model';
import { asyncHandler } from '../utils/asyncHandler';
import { assertCourseContentAccess, isCourseTeacher } from '../utils/courseAccess';

/** A Teacher who posted the item must still be a teacher of its course to change or delete it. */
const isCourseTeacherOf = async (user: IUser, courseId: Types.ObjectId): Promise<boolean> => {
  const course = await Course.findById(courseId).select('teachers');
  return Boolean(course && (await isCourseTeacher(user, course)));
};

const isText = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';

export const getCourseAnnouncements = asyncHandler(async (req: Request, res: Response) => {
  await assertCourseContentAccess(req.user, req.params.courseId);
  const announcements = await Announcement.find({ course: req.params.courseId })
    .populate('postedBy', 'name avatar role')
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: announcements, total: announcements.length });
});

export const createAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const { title, description } = req.body as { title: string; description: string };
  const courseId = req.params.courseId as string;

  if (!isText(title)) throw new AppError('Title is required', 400);
  if (!isText(description)) throw new AppError('Description is required', 400);

  const course = await Course.findById(courseId);
  if (!course) throw new AppError('Course not found', 404);

  if (req.user.role === 'Teacher') {
    const teacherProfile = await Teacher.findOne({ userId: req.user._id });
    if (!teacherProfile) throw new AppError('No teacher profile is linked to your account', 403);
    const isAssigned = course.teachers.some(
      (t) => t.toString() === (teacherProfile._id as Types.ObjectId).toString(),
    );
    if (!isAssigned) throw new AppError('You are not assigned to this course', 403);
  }

  const announcement = await Announcement.create({
    course: new Types.ObjectId(courseId),
    title: title.trim(),
    description: description.trim(),
    postedBy: req.user._id,
  });

  const populated = await announcement.populate('postedBy', 'name avatar role');
  res.status(201).json({ success: true, message: 'Announcement posted', data: populated });
});

export const deleteAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) throw new AppError('Announcement not found', 404);

  const isOwner = announcement.postedBy.toString() === (req.user._id as Types.ObjectId).toString();
  const isAdmin = req.user.role === 'Super Admin' || req.user.role === 'Admin' || req.user.role === 'Moderator';

  if (!isOwner && !isAdmin) throw new AppError('Not authorized to delete this announcement', 403);
  if (!isAdmin && !(await isCourseTeacherOf(req.user, announcement.course))) throw new AppError('You are no longer a teacher of this course', 403);

  await announcement.deleteOne();
  res.status(200).json({ success: true, message: 'Announcement deleted' });
});

export const updateAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const { title, description } = req.body as { title?: string; description?: string };
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) throw new AppError('Announcement not found', 404);

  const isOwner = announcement.postedBy.toString() === (req.user._id as Types.ObjectId).toString();
  const isAdmin = req.user.role === 'Super Admin' || req.user.role === 'Admin' || req.user.role === 'Moderator';

  if (!isOwner && !isAdmin) throw new AppError('Not authorized to update this announcement', 403);
  if (!isAdmin && !(await isCourseTeacherOf(req.user, announcement.course))) throw new AppError('You are no longer a teacher of this course', 403);
  if (!isText(title)) throw new AppError('Title is required', 400);
  if (!isText(description)) throw new AppError('Description is required', 400);

  announcement.title = title.trim();
  announcement.description = description.trim();
  await announcement.save();

  const populated = await announcement.populate('postedBy', 'name avatar role');
  res.status(200).json({ success: true, message: 'Announcement updated', data: populated });
});
