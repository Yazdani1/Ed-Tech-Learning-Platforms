import type { Request, Response } from 'express';
import { Category } from '../models/Category.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

const toSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await Category.find().sort({ name: 1 });
  res.status(200).json({ success: true, data: categories, total: categories.length });
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body as { name: string; description?: string };
  if (!name) throw new AppError('Category name is required', 400);

  const slug = toSlug(name);
  const existing = await Category.findOne({ slug });
  if (existing) throw new AppError('Category already exists', 400);

  const category = await Category.create({ name, slug, description });
  res.status(201).json({ success: true, message: 'Category created', data: category });
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body as { name?: string; description?: string };

  const update: Partial<{ name: string; slug: string; description: string }> = {};
  if (name) { update.name = name; update.slug = toSlug(name); }
  if (description !== undefined) update.description = description;

  const category = await Category.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!category) throw new AppError('Category not found', 404);

  res.status(200).json({ success: true, message: 'Category updated', data: category });
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new AppError('Category not found', 404);
  res.status(200).json({ success: true, message: 'Category deleted' });
});
