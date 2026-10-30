import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { StudyMaterial } from '../models/StudyMaterial.model';
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

/** Optional link: empty -> undefined; otherwise it must be an http(s) URL (no javascript:, data:, ...). */
const parseFileUrl = (fileUrl: unknown): string | undefined => {
  if (fileUrl === undefined || fileUrl === null) return undefined;
  if (typeof fileUrl !== 'string') throw new AppError('File URL must be an http or https link', 400);
  const trimmed = fileUrl.trim();
  if (!trimmed) return undefined;
  let protocol: string;
  try {
    protocol = new URL(trimmed).protocol;
  } catch {
    throw new AppError('File URL must be an http or https link', 400);
  }
  if (protocol !== 'http:' && protocol !== 'https:') {
    throw new AppError('File URL must be an http or https link', 400);
  }
  return trimmed;
};

export const getCourseStudyMaterials = asyncHandler(async (req: Request, res: Response) => {
  await assertCourseContentAccess(req.user, req.params.courseId);
  const materials = await StudyMaterial.find({ course: req.params.courseId })
    .populate('postedBy', 'name avatar role')
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: materials, total: materials.length });
});

export const createStudyMaterial = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, fileUrl } = req.body as { title: string; description: string; fileUrl?: string };
  const courseId = req.params.courseId as string;

  if (!isText(title)) throw new AppError('Title is required', 400);
  if (!isText(description)) throw new AppError('Description is required', 400);
  const safeFileUrl = parseFileUrl(fileUrl);

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

  const material = await StudyMaterial.create({
    course: new Types.ObjectId(courseId),
    title: title.trim(),
    description: description.trim(),
    fileUrl: safeFileUrl,
    postedBy: req.user._id,
  });

  const populated = await material.populate('postedBy', 'name avatar role');
  res.status(201).json({ success: true, message: 'Study material added', data: populated });
});

export const deleteStudyMaterial = asyncHandler(async (req: Request, res: Response) => {
  const material = await StudyMaterial.findById(req.params.id);
  if (!material) throw new AppError('Study material not found', 404);

  const isOwner = material.postedBy.toString() === (req.user._id as Types.ObjectId).toString();
  const isAdmin = req.user.role === 'Super Admin' || req.user.role === 'Admin' || req.user.role === 'Moderator';

  if (!isOwner && !isAdmin) throw new AppError('Not authorized to delete this study material', 403);
  if (!isAdmin && !(await isCourseTeacherOf(req.user, material.course))) throw new AppError('You are no longer a teacher of this course', 403);

  await material.deleteOne();
  res.status(200).json({ success: true, message: 'Study material deleted' });
});

export const updateStudyMaterial = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, fileUrl } = req.body as { title?: string; description?: string; fileUrl?: string };
  const material = await StudyMaterial.findById(req.params.id);
  if (!material) throw new AppError('Study material not found', 404);

  const isOwner = material.postedBy.toString() === (req.user._id as Types.ObjectId).toString();
  const isAdmin = req.user.role === 'Super Admin' || req.user.role === 'Admin' || req.user.role === 'Moderator';

  if (!isOwner && !isAdmin) throw new AppError('Not authorized to update this study material', 403);
  if (!isAdmin && !(await isCourseTeacherOf(req.user, material.course))) throw new AppError('You are no longer a teacher of this course', 403);
  if (!isText(title)) throw new AppError('Title is required', 400);
  if (!isText(description)) throw new AppError('Description is required', 400);
  const safeFileUrl = parseFileUrl(fileUrl);

  material.title = title.trim();
  material.description = description.trim();
  material.fileUrl = safeFileUrl;
  await material.save();

  const populated = await material.populate('postedBy', 'name avatar role');
  res.status(200).json({ success: true, message: 'Study material updated', data: populated });
});
