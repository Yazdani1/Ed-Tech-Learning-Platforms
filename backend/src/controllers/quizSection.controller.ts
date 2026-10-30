import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { QuizSection } from '../models/QuizSection.model';
import { QuizBank } from '../models/QuizBank.model';
import { QuizAttempt } from '../models/QuizAttempt.model';
import { Course } from '../models/Course.model';
import { Teacher } from '../models/Teacher.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { canAccessCourseContent } from '../utils/courseAccess';

async function canManage(userId: Types.ObjectId, courseId: string, role: string): Promise<boolean> {
  if (['Super Admin', 'Admin', 'Moderator'].includes(role)) return true;
  if (role === 'Teacher') {
    const course = await Course.findById(courseId);
    if (!course) return false;
    const teacher = await Teacher.findOne({ userId });
    if (!teacher) return false;
    return course.teachers.some(
      (t) => t.toString() === (teacher._id as Types.ObjectId).toString(),
    );
  }
  return false;
}

export const getCourseQuizSections = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  if (typeof courseId !== 'string' || !Types.ObjectId.isValid(courseId))
    throw new AppError('Invalid course id', 400);
  const course = await Course.findById(courseId, '_id teachers status visibility');
  if (!course) throw new AppError('Course not found', 404);
  // Without course access only the free-preview sections of a Published + Public course are listed.
  const filter: Record<string, unknown> = { course: courseId };
  if (!(await canAccessCourseContent(req.user, course))) {
    if (course.status !== 'Published' || course.visibility !== 'Public')
      throw new AppError('You do not have access to this course', 403);
    filter.isFreePreview = true;
  }
  const sections = await QuizSection.find(filter)
    .populate('createdBy', 'name avatar role')
    .sort({ order: 1, createdAt: 1 });
  if (filter.isFreePreview && sections.length === 0)
    throw new AppError('You do not have access to this course', 403);
  res.status(200).json({ success: true, data: sections, total: sections.length });
});

export const createQuizSection = asyncHandler(async (req: Request, res: Response) => {
  const { course: courseId, title, isFreePreview } = req.body as {
    course: string;
    title: string;
    isFreePreview?: boolean;
  };
  if (!courseId || !title?.trim()) throw new AppError('course and title are required', 400);
  if (typeof courseId !== 'string' || !Types.ObjectId.isValid(courseId))
    throw new AppError('Invalid course id', 400);
  if (!(await Course.exists({ _id: courseId }))) throw new AppError('Course not found', 404);

  const allowed = await canManage(req.user._id as Types.ObjectId, courseId, req.user.role);
  if (!allowed) throw new AppError('Not authorized', 403);

  const count = await QuizSection.countDocuments({ course: courseId });
  const section = await QuizSection.create({
    course: new Types.ObjectId(courseId),
    title: title.trim(),
    order: count,
    isFreePreview: isFreePreview ?? false,
    createdBy: req.user._id,
  });

  const populated = await section.populate('createdBy', 'name avatar role');
  res.status(201).json({ success: true, message: 'Quiz section created', data: populated });
});

export const updateQuizSection = asyncHandler(async (req: Request, res: Response) => {
  const section = await QuizSection.findById(req.params.id);
  if (!section) throw new AppError('Quiz section not found', 404);

  const allowed = await canManage(
    req.user._id as Types.ObjectId,
    section.course.toString(),
    req.user.role,
  );
  if (!allowed) throw new AppError('Not authorized', 403);

  const { title, isFreePreview } = req.body as { title?: string; isFreePreview?: boolean };
  if (title !== undefined) section.title = title.trim();
  if (isFreePreview !== undefined) section.isFreePreview = isFreePreview;
  await section.save();

  const populated = await section.populate('createdBy', 'name avatar role');
  res.status(200).json({ success: true, message: 'Quiz section updated', data: populated });
});

export const deleteQuizSection = asyncHandler(async (req: Request, res: Response) => {
  const section = await QuizSection.findById(req.params.id);
  if (!section) throw new AppError('Quiz section not found', 404);

  const allowed = await canManage(
    req.user._id as Types.ObjectId,
    section.course.toString(),
    req.user.role,
  );
  if (!allowed) throw new AppError('Not authorized', 403);

  const banks = await QuizBank.find({ quizSection: section._id }, '_id');
  if (banks.length > 0) {
    const bankIds = banks.map((b) => b._id);
    await QuizAttempt.deleteMany({ quizBank: { $in: bankIds } });
    await QuizBank.deleteMany({ quizSection: section._id });
  }

  await section.deleteOne();
  res.status(200).json({ success: true, message: 'Quiz section deleted' });
});
