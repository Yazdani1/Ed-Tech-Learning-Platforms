import type { Request, Response } from 'express';
import { Teacher } from '../models/Teacher.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary';

export const getTeachers = asyncHandler(async (_req: Request, res: Response) => {
  const teachers = await Teacher.find().sort({ name: 1 });
  res.status(200).json({ success: true, data: teachers, total: teachers.length });
});

export const getTeacherById = asyncHandler(async (req: Request, res: Response) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) throw new AppError('Teacher not found', 404);
  res.status(200).json({ success: true, data: teacher });
});

export const createTeacher = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as {
    name: string;
    bio: string;
    expertise: string;
    socialLinks?: string;
  };

  let profileImage: string | undefined;
  let profileImagePublicId: string | undefined;

  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, 'medhabee/teachers');
    profileImage = result.url;
    profileImagePublicId = result.publicId;
  }

  const teacher = await Teacher.create({
    name: body.name,
    bio: body.bio,
    expertise: body.expertise ? body.expertise.split(',').map((s) => s.trim()) : [],
    socialLinks: body.socialLinks ? (JSON.parse(body.socialLinks) as object) : undefined,
    profileImage,
    profileImagePublicId,
  });

  res.status(201).json({ success: true, message: 'Teacher created', data: teacher });
});

export const updateTeacher = asyncHandler(async (req: Request, res: Response) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) throw new AppError('Teacher not found', 404);

  const body = req.body as {
    name?: string;
    bio?: string;
    expertise?: string;
    socialLinks?: string;
  };

  if (req.file) {
    if (teacher.profileImagePublicId) {
      await deleteFromCloudinary(teacher.profileImagePublicId);
    }
    const result = await uploadToCloudinary(req.file.buffer, 'medhabee/teachers');
    teacher.profileImage = result.url;
    teacher.profileImagePublicId = result.publicId;
  }

  if (body.name) teacher.name = body.name;
  if (body.bio) teacher.bio = body.bio;
  if (body.expertise) teacher.expertise = body.expertise.split(',').map((s) => s.trim());
  if (body.socialLinks) teacher.socialLinks = JSON.parse(body.socialLinks) as typeof teacher.socialLinks;

  await teacher.save();
  res.status(200).json({ success: true, message: 'Teacher updated', data: teacher });
});

export const deleteTeacher = asyncHandler(async (req: Request, res: Response) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) throw new AppError('Teacher not found', 404);

  if (teacher.profileImagePublicId) {
    await deleteFromCloudinary(teacher.profileImagePublicId);
  }

  await teacher.deleteOne();
  res.status(200).json({ success: true, message: 'Teacher deleted' });
});
