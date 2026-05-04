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

const STAFF_ROLES = ['Admin', 'Super Admin', 'Moderator', 'Teacher'];

const isAdminOrModerator = (role: string): boolean =>
  role === 'Admin' || role === 'Super Admin' || role === 'Moderator';

async function isAssignedTeacher(user: IUser, courseId: string): Promise<boolean> {
  if (user.role !== 'Teacher') return false;

  const [teacherProfile, course] = await Promise.all([
    Teacher.findOne({ userId: user._id }).select('_id'),
    Course.findById(courseId).select('teachers'),
  ]);

  if (!course) throw new AppError('Course not found', 404);
  if (!teacherProfile) return false;

  return course.teachers.some(
    (t) => t.toString() === (teacherProfile._id as Types.ObjectId).toString(),
  );
}

async function assertCanResolveQuestion(
  user: IUser,
  question: { course: Types.ObjectId; postedBy: Types.ObjectId },
): Promise<void> {
  if (isAdminOrModerator(user.role)) return;

  if (user.role === 'Teacher' && (await isAssignedTeacher(user, question.course.toString()))) {
    return;
  }

  const isOwner = question.postedBy.toString() === (user._id as Types.ObjectId).toString();
  if (user.role === 'Student' && isOwner) return;

  throw new AppError('Not authorized to change this question status', 403);
}

async function getQuestionAnswerStats(questionIds: Types.ObjectId[]) {
  if (questionIds.length === 0) {
    return new Map<string, { answerCount: number; staffAnswerCount: number }>();
  }

  const answerStats = await Answer.aggregate<{
    _id: Types.ObjectId;
    answerCount: number;
    staffAnswerCount: number;
  }>([
    { $match: { question: { $in: questionIds } } },
    {
      $lookup: {
        from: 'users',
        localField: 'postedBy',
        foreignField: '_id',
        as: 'postedByUser',
      },
    },
    { $unwind: '$postedByUser' },
    {
      $group: {
        _id: '$question',
        answerCount: { $sum: 1 },
        staffAnswerCount: {
          $sum: {
            $cond: [{ $in: ['$postedByUser.role', STAFF_ROLES] }, 1, 0],
          },
        },
      },
    },
  ]);

  return new Map(
    answerStats.map((a) => [
      a._id.toString(),
      { answerCount: a.answerCount, staffAnswerCount: a.staffAnswerCount },
    ]),
  );
}

async function buildQuestionResponse(question: InstanceType<typeof Question>) {
  const statsMap = await getQuestionAnswerStats([question._id as Types.ObjectId]);
  const stats = statsMap.get((question._id as Types.ObjectId).toString()) ?? {
    answerCount: 0,
    staffAnswerCount: 0,
  };

  return {
    ...(question.toObject() as object),
    isResolved: Boolean(question.isResolved),
    answerCount: stats.answerCount,
    staffAnswerCount: stats.staffAnswerCount,
    hasStaffAnswer: stats.staffAnswerCount > 0,
  };
}

// ── Access control helper ────────────────────────────────────
async function assertCanPost(user: IUser, courseId: string): Promise<void> {
  const role = user.role;

  if (isAdminOrModerator(role)) return;

  const course = await Course.findById(courseId).select('teachers');
  if (!course) throw new AppError('Course not found', 404);

  if (role === 'Teacher') {
    if (!(await isAssignedTeacher(user, courseId))) {
      throw new AppError('You are not assigned to this course', 403);
    }
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

  const questionIds = questions.map((q) => q._id as Types.ObjectId);
  const statsMap = await getQuestionAnswerStats(questionIds);

  const result = questions.map((q) => {
    const stats = statsMap.get((q._id as Types.ObjectId).toString()) ?? {
      answerCount: 0,
      staffAnswerCount: 0,
    };

    return {
      ...(q.toObject() as object),
      isResolved: Boolean(q.isResolved),
      answerCount: stats.answerCount,
      staffAnswerCount: stats.staffAnswerCount,
      hasStaffAnswer: stats.staffAnswerCount > 0,
    };
  });

  res.status(200).json({ success: true, data: result, total: result.length });
});

export const getAllCourseQuestions = asyncHandler(async (_req: Request, res: Response) => {
  const questions = await Question.find({ isResolved: { $ne: true } })
    .populate('postedBy', 'name avatar role')
    .populate('course', 'title subtitle status coverImage')
    .sort({ createdAt: -1 });

  const questionIds = questions.map((q) => q._id as Types.ObjectId);
  const statsMap = await getQuestionAnswerStats(questionIds);
  const groupMap = new Map<string, { course: unknown; questions: object[] }>();

  questions.forEach((q) => {
    const course = q.course as unknown as { _id: Types.ObjectId };
    if (!course?._id) return;

    const stats = statsMap.get((q._id as Types.ObjectId).toString()) ?? {
      answerCount: 0,
      staffAnswerCount: 0,
    };
    const courseId = course._id.toString();

    if (!groupMap.has(courseId)) {
      groupMap.set(courseId, { course, questions: [] });
    }

    const questionObject = q.toObject() as unknown as Record<string, unknown>;
    questionObject.course = courseId;

    groupMap.get(courseId)!.questions.push({
      ...questionObject,
      isResolved: Boolean(q.isResolved),
      answerCount: stats.answerCount,
      staffAnswerCount: stats.staffAnswerCount,
      hasStaffAnswer: stats.staffAnswerCount > 0,
    });
  });

  const groups = Array.from(groupMap.values()).sort((a, b) => {
    const courseA = a.course as { title?: string };
    const courseB = b.course as { title?: string };
    return (courseA.title ?? '').localeCompare(courseB.title ?? '');
  });

  res.status(200).json({ success: true, data: groups, total: groups.length });
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
    data: { question: await buildQuestionResponse(question), answers },
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
    data: {
      ...(populated.toObject() as object),
      isResolved: Boolean(populated.isResolved),
      answerCount: 0,
      staffAnswerCount: 0,
      hasStaffAnswer: false,
    },
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

  res.status(200).json({
    success: true,
    message: 'Question updated',
    data: await buildQuestionResponse(populated),
  });
});

export const resolveQuestion = asyncHandler(async (req: Request, res: Response) => {
  const { isResolved } = req.body as { isResolved?: boolean };
  const question = await Question.findById(req.params.id);
  if (!question) throw new AppError('Question not found', 404);

  if (typeof isResolved !== 'boolean') {
    throw new AppError('isResolved must be true or false', 400);
  }

  await assertCanResolveQuestion(req.user, {
    course: question.course,
    postedBy: question.postedBy,
  });

  question.isResolved = isResolved;
  question.resolvedBy = isResolved ? (req.user._id as Types.ObjectId) : undefined;
  question.resolvedAt = isResolved ? new Date() : undefined;
  await question.save();

  const populated = await question
    .populate('postedBy', 'name avatar role')
    .then((q) => q.populate('resolvedBy', 'name avatar role'));

  res.status(200).json({
    success: true,
    message: isResolved ? 'Question marked as resolved' : 'Question reopened',
    data: await buildQuestionResponse(populated),
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
