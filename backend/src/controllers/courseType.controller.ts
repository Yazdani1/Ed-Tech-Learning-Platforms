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

const MAX_POSITION = 999;

/** `position` from the body: undefined = not sent, null = cleared ('' or null), else a whole number 1-999. */
const parsePosition = (value: unknown): number | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const position = typeof value === 'string' ? Number(value) : value;
  if (typeof position !== 'number' || !Number.isInteger(position) || position < 1 || position > MAX_POSITION) {
    throw new AppError('Position must be a whole number from 1 to 999', 400);
  }
  return position;
};

/** Numbered types first (1, 2, ...), then the others; ties and unnumbered types by name. */
const byPosition = (
  a: { position?: number | null; name: string },
  b: { position?: number | null; name: string },
): number => {
  const pa = a.position ?? Number.POSITIVE_INFINITY;
  const pb = b.position ?? Number.POSITIVE_INFINITY;
  if (pa !== pb) return pa - pb;
  return a.name.localeCompare(b.name);
};

export const getCourseTypes = asyncHandler(async (_req: Request, res: Response) => {
  const courseTypes = (await CourseType.find().sort({ name: 1 })).sort(byPosition);
  res.status(200).json({ success: true, data: courseTypes, total: courseTypes.length });
});

export const createCourseType = asyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body as { name: string; description?: string };

  if (typeof name !== 'string' || !name.trim()) throw new AppError('Course type name is required', 400);
  const position = parsePosition((req.body as { position?: unknown }).position) ?? null;

  const slug = toSlug(name.trim());
  if (!slug) throw new AppError('Course type name must contain valid characters', 400);

  const existing = await CourseType.findOne({ slug });
  if (existing) throw new AppError('A course type with this name already exists', 400);

  const courseType = await CourseType.create({ name: name.trim(), slug, description, position });
  res.status(201).json({ success: true, message: 'Course type created', data: courseType });
});

export const updateCourseType = asyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body as { name?: string; description?: string };

  const update: Partial<{ name: string; slug: string; description: string; position: number | null }> = {};
  const position = parsePosition((req.body as { position?: unknown }).position);
  if (position !== undefined) update.position = position;

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
