import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Question } from '../models/Question.model';
import { Answer } from '../models/Answer.model';
import { Course } from '../models/Course.model';
import { Teacher } from '../models/Teacher.model';
import { Enrollment } from '../models/Enrollment.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import type { IUser } from '../models/User.model';

// ── Access control helper ────────────────────────────────────
async function assertCanPost(user: IUser, courseId: string): Promise<void> {
  const role = user.role;

  if (role === 'Admin' || role === 'Super Admin' || role === 'Moderator') return;

  const course = await Course.findById(courseId).select('teachers');
  if (!course) throw new AppError('Course not found', 404);

  if (role === 'Teacher') {
    const teacherProfile = await Teacher.findOne({ userId: user._id }).select('_id');
    if (!teacherProfile) throw new AppError('No teacher profile linked to your account', 403);
    const isAssigned = course.teachers.some(
      (t) => t.toString() === (teacherProfile._id as Types.ObjectId).toString(),
    );
    if (!isAssigned) throw new AppError('You are not assigned to this course', 403);
    return;
  }

  if (role === 'Student') {
    const enrolled = await Enrollment.exists({ student: user._id, course: courseId });
    if (!enrolled) throw new AppError('You are not enrolled in this course', 403);
    return;
  }

  throw new AppError('Not authorized', 403);
}

// ── Questions ────────────────────────────────────────────────

export const getCourseQuestions = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;

  const questions = await Question.find({ course: courseId })
    .populate('postedBy', 'name avatar role')
    .sort({ createdAt: -1 });

  // Count answers per question in one aggregation query
  const questionIds = questions.map((q) => q._id as Types.ObjectId);
  const answerCounts = await Answer.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { question: { $in: questionIds } } },
    { $group: { _id: '$question', count: { $sum: 1 } } },
  ]);

  const countMap = new Map(answerCounts.map((a) => [a._id.toString(), a.count]));

  const result = questions.map((q) => ({
    ...(q.toObject() as object),
    answerCount: countMap.get((q._id as Types.ObjectId).toString()) ?? 0,
  }));

  res.status(200).json({ success: true, data: result, total: result.length });
});

export const getQuestionWithAnswers = asyncHandler(async (req: Request, res: Response) => {
  const question = await Question.findById(req.params.id)
    .populate('postedBy', 'name avatar role');
  if (!question) throw new AppError('Question not found', 404);

  const answers = await Answer.find({ question: question._id })
    .populate('postedBy', 'name avatar role')
    .sort({ createdAt: 1 });

  res.status(200).json({
    success: true,
    data: { question, answers },
  });
});

export const createQuestion = asyncHandler(async (req: Request, res: Response) => {
  const courseId = String(req.params.courseId);
  const { title, description } = req.body as { title: string; description: string };

  if (!title?.trim()) throw new AppError('Title is required', 400);
  if (!description?.trim()) throw new AppError('Description is required', 400);

  await assertCanPost(req.user, courseId);

  const question = await Question.create({
    course: new Types.ObjectId(courseId),
    title: title.trim(),
    description: description.trim(),
    postedBy: req.user._id,
  });

  const populated = await question.populate('postedBy', 'name avatar role');

  res.status(201).json({
    success: true,
    message: 'Question posted',
    data: { ...(populated.toObject() as object), answerCount: 0 },
  });
});

export const deleteQuestion = asyncHandler(async (req: Request, res: Response) => {
  const question = await Question.findById(req.params.id);
  if (!question) throw new AppError('Question not found', 404);

  const isOwner = question.postedBy.toString() === (req.user._id as Types.ObjectId).toString();
  const isAdmin =
    req.user.role === 'Super Admin' ||
    req.user.role === 'Admin' ||
    req.user.role === 'Moderator';

  if (!isOwner && !isAdmin) throw new AppError('Not authorized to delete this question', 403);

  await Answer.deleteMany({ question: question._id });
  await question.deleteOne();

  res.status(200).json({ success: true, message: 'Question deleted' });
});

export const updateQuestion = asyncHandler(async (req: Request, res: Response) => {
  const { title, description } = req.body as { title?: string; description?: string };
  const question = await Question.findById(req.params.id);
  if (!question) throw new AppError('Question not found', 404);

  const isOwner = question.postedBy.toString() === (req.user._id as Types.ObjectId).toString();
  const isAdmin =
    req.user.role === 'Super Admin' ||
    req.user.role === 'Admin' ||
    req.user.role === 'Moderator';

  if (!isOwner && !isAdmin) throw new AppError('Not authorized to update this question', 403);
  if (!title?.trim()) throw new AppError('Title is required', 400);
  if (!description?.trim()) throw new AppError('Description is required', 400);

  question.title = title.trim();
  question.description = description.trim();
  await question.save();

  const populated = await question.populate('postedBy', 'name avatar role');
  const answerCount = await Answer.countDocuments({ question: question._id });

  res.status(200).json({
    success: true,
    message: 'Question updated',
    data: { ...(populated.toObject() as object), answerCount },
  });
});

export const upvoteQuestion = asyncHandler(async (req: Request, res: Response) => {
  const question = await Question.findById(req.params.id);
  if (!question) throw new AppError('Question not found', 404);

  const userId = (req.user._id as Types.ObjectId).toString();
  const idx = question.upvotes.findIndex((id) => id.toString() === userId);

  if (idx > -1) {
    question.upvotes.splice(idx, 1);
  } else {
    question.upvotes.push(req.user._id as Types.ObjectId);
  }

  await question.save();

  res.status(200).json({
    success: true,
    data: { upvotes: question.upvotes.map((id) => id.toString()) },
  });
});

// ── Answers ──────────────────────────────────────────────────

export const createAnswer = asyncHandler(async (req: Request, res: Response) => {
  const questionId = String(req.params.questionId);
  const { body } = req.body as { body: string };

  if (!body?.trim()) throw new AppError('Answer body is required', 400);

  const question = await Question.findById(questionId).select('course');
  if (!question) throw new AppError('Question not found', 404);

  await assertCanPost(req.user, question.course.toString());

  const answer = await Answer.create({
    question: new Types.ObjectId(questionId),
    body: body.trim(),
    postedBy: req.user._id,
  });

  const populated = await answer.populate('postedBy', 'name avatar role');

  res.status(201).json({ success: true, message: 'Answer posted', data: populated });
});

export const deleteAnswer = asyncHandler(async (req: Request, res: Response) => {
  const answer = await Answer.findById(req.params.id);
  if (!answer) throw new AppError('Answer not found', 404);

  const isOwner = answer.postedBy.toString() === (req.user._id as Types.ObjectId).toString();
  const isAdmin =
    req.user.role === 'Super Admin' ||
    req.user.role === 'Admin' ||
    req.user.role === 'Moderator';

  if (!isOwner && !isAdmin) throw new AppError('Not authorized to delete this answer', 403);

  await answer.deleteOne();

  res.status(200).json({ success: true, message: 'Answer deleted' });
});

export const updateAnswer = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req.body as { body?: string };
  const answer = await Answer.findById(req.params.id);
  if (!answer) throw new AppError('Answer not found', 404);

  const isOwner = answer.postedBy.toString() === (req.user._id as Types.ObjectId).toString();
  const isAdmin =
    req.user.role === 'Super Admin' ||
    req.user.role === 'Admin' ||
    req.user.role === 'Moderator';

  if (!isOwner && !isAdmin) throw new AppError('Not authorized to update this answer', 403);
  if (!body?.trim()) throw new AppError('Answer body is required', 400);

  answer.body = body.trim();
  await answer.save();

  const populated = await answer.populate('postedBy', 'name avatar role');
  res.status(200).json({ success: true, message: 'Answer updated', data: populated });
});

export const upvoteAnswer = asyncHandler(async (req: Request, res: Response) => {
  const answer = await Answer.findById(req.params.id);
  if (!answer) throw new AppError('Answer not found', 404);

  const userId = (req.user._id as Types.ObjectId).toString();
  const idx = answer.upvotes.findIndex((id) => id.toString() === userId);

  if (idx > -1) {
    answer.upvotes.splice(idx, 1);
  } else {
    answer.upvotes.push(req.user._id as Types.ObjectId);
  }

  await answer.save();

  res.status(200).json({
    success: true,
    data: { upvotes: answer.upvotes.map((id) => id.toString()) },
  });
});
