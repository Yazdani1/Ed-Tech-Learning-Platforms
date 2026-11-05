import type { Request, Response } from 'express';
import { CourseType } from '../models/CourseType.model';
import { Course } from '../models/Course.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

const toSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

export const getCourseTypes = asyncHandler(async (_req: Request, res: Response) => {
  const courseTypes = await CourseType.find().sort({ name: 1 });
  res.status(200).json({ success: true, data: courseTypes, total: courseTypes.length });
});

export const createCourseType = asyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body as { name: string; description?: string };

  if (typeof name !== 'string' || !name.trim()) throw new AppError('Course type name is required', 400);

  const slug = toSlug(name.trim());
  if (!slug) throw new AppError('Course type name must contain valid characters', 400);

  const existing = await CourseType.findOne({ slug });
  if (existing) throw new AppError('A course type with this name already exists', 400);

  const courseType = await CourseType.create({ name: name.trim(), slug, description });
  res.status(201).json({ success: true, message: 'Course type created', data: courseType });
});

export const updateCourseType = asyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body as { name?: string; description?: string };

  const update: Partial<{ name: string; slug: string; description: string }> = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) throw new AppError('Course type name cannot be empty', 400);
    update.name = name.trim();
    update.slug = toSlug(name.trim());
    if (!update.slug) throw new AppError('Course type name must contain valid characters', 400);

    const existing = await CourseType.findOne({ slug: update.slug, _id: { $ne: req.params.id } });
    if (existing) throw new AppError('A course type with this name already exists', 400);
  }

  if (description !== undefined) update.description = description;

  const courseType = await CourseType.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!courseType) throw new AppError('Course type not found', 404);

  res.status(200).json({ success: true, message: 'Course type updated', data: courseType });
});

export const deleteCourseType = asyncHandler(async (req: Request, res: Response) => {
  const courseType = await CourseType.findById(req.params.id);
  if (!courseType) throw new AppError('Course type not found', 404);
  const usedBy = await Course.countDocuments({ courseType: courseType._id });
  if (usedBy > 0) throw new AppError(`Course type is used by ${usedBy} course(s)`, 400);
  await courseType.deleteOne();
  res.status(200).json({ success: true, message: 'Course type deleted' });
});
