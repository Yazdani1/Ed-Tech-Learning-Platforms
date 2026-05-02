import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { StudyMaterial } from '../models/StudyMaterial.model';
import { Course } from '../models/Course.model';
import { Teacher } from '../models/Teacher.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

export const getCourseStudyMaterials = asyncHandler(async (req: Request, res: Response) => {
  const materials = await StudyMaterial.find({ course: req.params.courseId })
    .populate('postedBy', 'name avatar role')
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: materials, total: materials.length });
});

export const createStudyMaterial = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, fileUrl } = req.body as { title: string; description: string; fileUrl?: string };
  const { courseId } = req.params;

  if (!title?.trim()) throw new AppError('Title is required', 400);
  if (!description?.trim()) throw new AppError('Description is required', 400);

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
    fileUrl: fileUrl?.trim() || undefined,
    postedBy: req.user._id,
  });

  const populated = await material.populate('postedBy', 'name avatar role');
  res.status(201).json({ success: true, message: 'Study material added', data: populated });
});

export const deleteStudyMaterial = asyncHandler(async (req: Request, res: Response) => {
  const material = await StudyMaterial.findById(req.params.id);
  if (!material) throw new AppError('Study material not found', 404);

  const isOwner = material.postedBy.toString() === (req.user._id as Types.ObjectId).toString();
  const isAdmin = req.user.role === 'Super Admin' || req.user.role === 'Admin';

  if (!isOwner && !isAdmin) throw new AppError('Not authorized to delete this study material', 403);

  await material.deleteOne();
  res.status(200).json({ success: true, message: 'Study material deleted' });
});
