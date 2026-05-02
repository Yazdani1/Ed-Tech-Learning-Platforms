import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Teacher } from '../models/Teacher.model';
import { Course } from '../models/Course.model';
import { User } from '../models/User.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary';

async function resolveUserId(userId: string): Promise<Types.ObjectId> {
  if (!Types.ObjectId.isValid(userId)) throw new AppError('Invalid user ID', 400);
  const user = await User.findById(userId).select('role');
  if (!user) throw new AppError('User not found', 404);
  if (user.role !== 'Teacher') throw new AppError('Linked user must have the Teacher role', 400);
  const existing = await Teacher.findOne({ userId: new Types.ObjectId(userId) });
  if (existing) throw new AppError('This user is already linked to another teacher profile', 400);
  return new Types.ObjectId(userId);
}

export const getTeachers = asyncHandler(async (_req: Request, res: Response) => {
  const teachers = await Teacher.find().sort({ name: 1 });
  res.status(200).json({ success: true, data: teachers, total: teachers.length });
});

export const getTeacherById = asyncHandler(async (req: Request, res: Response) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) throw new AppError('Teacher not found', 404);
  res.status(200).json({ success: true, data: teacher });
});

export const getMyTeacherCourses = asyncHandler(async (req: Request, res: Response) => {
  const teacherProfile = await Teacher.findOne({ userId: req.user._id });
  if (!teacherProfile) {
    res.status(200).json({ success: true, data: [], total: 0 });
    return;
  }
  const courses = await Course.find({ teachers: teacherProfile._id })
    .populate('category', 'name slug')
    .populate('teachers', 'name profileImage')
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: courses, total: courses.length });
});

export const createTeacher = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as {
    name: string;
    bio: string;
    expertise: string;
    socialLinks?: string;
    userId?: string;
  };

  let profileImage: string | undefined;
  let profileImagePublicId: string | undefined;

  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, 'medhabee/teachers');
    profileImage = result.url;
    profileImagePublicId = result.publicId;
  }

  const resolvedUserId = body.userId ? await resolveUserId(body.userId) : undefined;

  const teacher = await Teacher.create({
    name: body.name,
    bio: body.bio,
    expertise: body.expertise ? body.expertise.split(',').map((s) => s.trim()) : [],
    socialLinks: body.socialLinks ? (JSON.parse(body.socialLinks) as object) : undefined,
    profileImage,
    profileImagePublicId,
    userId: resolvedUserId,
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
    userId?: string;
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
  if ('userId' in body) {
    if (body.userId) {
      if (!Types.ObjectId.isValid(body.userId)) throw new AppError('Invalid user ID', 400);
      const user = await User.findById(body.userId).select('role');
      if (!user) throw new AppError('User not found', 404);
      if (user.role !== 'Teacher') throw new AppError('Linked user must have the Teacher role', 400);
      const duplicate = await Teacher.findOne({ userId: new Types.ObjectId(body.userId), _id: { $ne: teacher._id } });
      if (duplicate) throw new AppError('This user is already linked to another teacher profile', 400);
      teacher.userId = new Types.ObjectId(body.userId);
    } else {
      teacher.userId = undefined;
    }
  }

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
