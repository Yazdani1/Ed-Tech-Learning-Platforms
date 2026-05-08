import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { QuizBank, type QuizContextType } from '../models/QuizBank.model';
import { QuizSection } from '../models/QuizSection.model';
import { QuizAttempt } from '../models/QuizAttempt.model';
import { Course } from '../models/Course.model';
import { Teacher } from '../models/Teacher.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

async function canPost(userId: Types.ObjectId, courseId: string, role: string): Promise<boolean> {
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

function arraysEqualSorted(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
}

export const createQuizBank = asyncHandler(async (req: Request, res: Response) => {
  const { course: courseId, quizSection, contextType, contextId, title, description } =
    req.body as {
      course: string;
      quizSection?: string;
      contextType?: string;
      contextId?: string;
      title: string;
      description?: string;
    };

  if (!courseId || !title?.trim())
    throw new AppError('course and title are required', 400);

  if (!quizSection && (!contextType || !contextId))
    throw new AppError('quizSection or contextType+contextId is required', 400);

  if (contextType && !['Section', 'Announcement', 'Course'].includes(contextType))
    throw new AppError('contextType must be Section, Announcement, or Course', 400);

  const allowed = await canPost(req.user._id as Types.ObjectId, courseId, req.user.role);
  if (!allowed) throw new AppError('Not authorized to manage quiz banks for this course', 403);

  const { isFreePreview } = req.body as { isFreePreview?: boolean };

  const bank = await QuizBank.create({
    course: new Types.ObjectId(courseId),
    quizSection: quizSection ? new Types.ObjectId(quizSection) : undefined,
    contextType: contextType ? (contextType as QuizContextType) : undefined,
    contextId: contextId ? new Types.ObjectId(contextId) : undefined,
    title: title.trim(),
    description: description?.trim(),
    isFreePreview: isFreePreview ?? false,
    createdBy: req.user._id,
  });

  const populated = await bank.populate('createdBy', 'name avatar role');
  res.status(201).json({ success: true, message: 'Quiz bank created', data: populated });
});

export const getCourseQuizBanks = asyncHandler(async (req: Request, res: Response) => {
  const banks = await QuizBank.find({ course: req.params.courseId })
    .populate('createdBy', 'name avatar role')
    .sort({ createdAt: 1 });
  res.status(200).json({ success: true, data: banks, total: banks.length });
});

export const getContextQuizBanks = asyncHandler(async (req: Request, res: Response) => {
  const { contextType, contextId } = req.params;
  const banks = await QuizBank.find({
    contextType: contextType as QuizContextType,
    contextId,
  })
    .populate('createdBy', 'name avatar role')
    .sort({ createdAt: 1 });
  res.status(200).json({ success: true, data: banks, total: banks.length });
});

export const getQuizBank = asyncHandler(async (req: Request, res: Response) => {
  const bank = await QuizBank.findById(req.params.id).populate('createdBy', 'name avatar role');
  if (!bank) throw new AppError('Quiz bank not found', 404);
  res.status(200).json({ success: true, data: bank });
});

export const updateQuizBank = asyncHandler(async (req: Request, res: Response) => {
  const bank = await QuizBank.findById(req.params.id);
  if (!bank) throw new AppError('Quiz bank not found', 404);

  const allowed = await canPost(req.user._id as Types.ObjectId, bank.course.toString(), req.user.role);
  if (!allowed) throw new AppError('Not authorized', 403);

  const { title, description, isFreePreview } = req.body as {
    title?: string;
    description?: string;
    isFreePreview?: boolean;
  };
  if (title !== undefined) bank.title = title.trim();
  if (description !== undefined) bank.description = description?.trim() || undefined;
  if (isFreePreview !== undefined) bank.isFreePreview = isFreePreview;
  await bank.save();

  const populated = await bank.populate('createdBy', 'name avatar role');
  res.status(200).json({ success: true, message: 'Quiz bank updated', data: populated });
});

export const deleteQuizBank = asyncHandler(async (req: Request, res: Response) => {
  const bank = await QuizBank.findById(req.params.id);
  if (!bank) throw new AppError('Quiz bank not found', 404);

  const allowed = await canPost(req.user._id as Types.ObjectId, bank.course.toString(), req.user.role);
  if (!allowed) throw new AppError('Not authorized', 403);

  await bank.deleteOne();
  await QuizAttempt.deleteMany({ quizBank: bank._id });
  res.status(200).json({ success: true, message: 'Quiz bank deleted' });
});

export const addQuestion = asyncHandler(async (req: Request, res: Response) => {
  const bank = await QuizBank.findById(req.params.id);
  if (!bank) throw new AppError('Quiz bank not found', 404);

  const allowed = await canPost(req.user._id as Types.ObjectId, bank.course.toString(), req.user.role);
  if (!allowed) throw new AppError('Not authorized', 403);

  const { question, options, correctOptionIndices } = req.body as {
    question: string;
    options: { text: string; explanation?: string }[];
    correctOptionIndices: number[];
  };

  if (!question?.trim()) throw new AppError('Question text is required', 400);
  if (!Array.isArray(options) || options.length !== 4)
    throw new AppError('Exactly 4 options are required', 400);
  if (
    !Array.isArray(correctOptionIndices) ||
    correctOptionIndices.length === 0 ||
    correctOptionIndices.some((i) => i < 0 || i > 3)
  )
    throw new AppError('correctOptionIndices must be a non-empty array of values 0–3', 400);

  bank.questions.push({
    _id: new Types.ObjectId(),
    question: question.trim(),
    options: options.map((o) => ({
      text: o.text?.trim() ?? '',
      explanation: o.explanation?.trim() || undefined,
    })),
    correctOptionIndices,
    order: bank.questions.length,
  });

  await bank.save();
  res.status(201).json({ success: true, message: 'Question added', data: bank });
});

export const updateQuestion = asyncHandler(async (req: Request, res: Response) => {
  const bank = await QuizBank.findById(req.params.id);
  if (!bank) throw new AppError('Quiz bank not found', 404);

  const allowed = await canPost(req.user._id as Types.ObjectId, bank.course.toString(), req.user.role);
  if (!allowed) throw new AppError('Not authorized', 403);

  const qIndex = bank.questions.findIndex((q) => q._id.toString() === req.params.qId);
  if (qIndex === -1) throw new AppError('Question not found', 404);

  const { question, options, correctOptionIndices } = req.body as {
    question?: string;
    options?: { text: string; explanation?: string }[];
    correctOptionIndices?: number[];
  };

  if (question !== undefined) bank.questions[qIndex].question = question.trim();
  if (options !== undefined) {
    if (options.length !== 4) throw new AppError('Exactly 4 options are required', 400);
    bank.questions[qIndex].options = options.map((o) => ({
      text: o.text?.trim() ?? '',
      explanation: o.explanation?.trim() || undefined,
    }));
  }
  if (correctOptionIndices !== undefined) {
    if (
      !Array.isArray(correctOptionIndices) ||
      correctOptionIndices.length === 0 ||
      correctOptionIndices.some((i) => i < 0 || i > 3)
    )
      throw new AppError('correctOptionIndices must be a non-empty array of values 0–3', 400);
    bank.questions[qIndex].correctOptionIndices = correctOptionIndices;
  }

  await bank.save();
  res.status(200).json({ success: true, message: 'Question updated', data: bank });
});

export const deleteQuestion = asyncHandler(async (req: Request, res: Response) => {
  const bank = await QuizBank.findById(req.params.id);
  if (!bank) throw new AppError('Quiz bank not found', 404);

  const allowed = await canPost(req.user._id as Types.ObjectId, bank.course.toString(), req.user.role);
  if (!allowed) throw new AppError('Not authorized', 403);

  const before = bank.questions.length;
  bank.questions = bank.questions.filter(
    (q) => q._id.toString() !== req.params.qId,
  ) as typeof bank.questions;

  if (bank.questions.length === before) throw new AppError('Question not found', 404);
  await bank.save();
  res.status(200).json({ success: true, message: 'Question deleted', data: bank });
});

export const getMyAttempt = asyncHandler(async (req: Request, res: Response) => {
  const attempt = await QuizAttempt.findOne({
    student: req.user._id,
    quizBank: req.params.id,
  });
  res.status(200).json({ success: true, data: attempt ?? null });
});

export const submitAnswer = asyncHandler(async (req: Request, res: Response) => {
  const { questionId, selectedOptionIndices } = req.body as {
    questionId: string;
    selectedOptionIndices: number[];
  };

  if (!questionId) throw new AppError('questionId is required', 400);
  if (!Array.isArray(selectedOptionIndices))
    throw new AppError('selectedOptionIndices must be an array', 400);

  const bank = await QuizBank.findById(req.params.id);
  if (!bank) throw new AppError('Quiz bank not found', 404);

  const q = bank.questions.find((q) => q._id.toString() === questionId);
  if (!q) throw new AppError('Question not found in this quiz bank', 404);

  const isCorrect =
    selectedOptionIndices.length > 0 &&
    arraysEqualSorted(selectedOptionIndices, q.correctOptionIndices);

  let attempt = await QuizAttempt.findOne({
    student: req.user._id,
    quizBank: bank._id,
  });

  if (!attempt) {
    attempt = await QuizAttempt.create({
      student: req.user._id,
      quizBank: bank._id,
      course: bank.course,
      answers: [],
    });
  }

  const existingIdx = attempt.answers.findIndex(
    (a) => a.questionId.toString() === questionId,
  );

  if (existingIdx >= 0) {
    attempt.answers[existingIdx].selectedOptionIndices = selectedOptionIndices;
    attempt.answers[existingIdx].isCorrect = isCorrect;
  } else {
    attempt.answers.push({
      questionId: new Types.ObjectId(questionId),
      selectedOptionIndices,
      isCorrect,
    });
  }

  await attempt.save();
  res.status(200).json({ success: true, data: attempt });
});

export const resetAttempt = asyncHandler(async (req: Request, res: Response) => {
  await QuizAttempt.findOneAndDelete({
    student: req.user._id,
    quizBank: req.params.id,
  });
  res.status(200).json({ success: true, message: 'Attempt reset' });
});

// ── Public (no auth) ────────────────────────────────────────────────────────

export const getPublicCoursesWithQuizzes = asyncHandler(
  async (_req: Request, res: Response) => {
    const freeSectionCourses = await QuizSection.find(
      { isFreePreview: true },
      'course',
    ).distinct('course');
    const freeBankCourses = await QuizBank.find(
      { isFreePreview: true },
      'course',
    ).distinct('course');

    const courseIds = [
      ...new Set([
        ...freeSectionCourses.map(String),
        ...freeBankCourses.map(String),
      ]),
    ];

    const courses = await Course.find(
      { _id: { $in: courseIds } },
      'title subtitle coverImage',
    );

    res.status(200).json({ success: true, data: courses });
  },
);

export const getPublicCourseQuizBanks = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseId } = req.params;

    const course = await Course.findById(courseId, 'title subtitle coverImage');
    if (!course) throw new AppError('Course not found', 404);

    const sections = await QuizSection.find({ course: courseId }).sort({
      order: 1,
      createdAt: 1,
    });
    const banks = await QuizBank.find({ course: courseId });

    const freeSectionIds = new Set(
      sections.filter((s) => s.isFreePreview).map((s) => s._id.toString()),
    );

    const result = [];
    for (const section of sections) {
      const sectionBanks = banks.filter(
        (b) => b.quizSection?.toString() === section._id.toString(),
      );
      const visibleBanks = section.isFreePreview
        ? sectionBanks
        : sectionBanks.filter((b) => b.isFreePreview);

      if (visibleBanks.length > 0) {
        result.push({
          _id: section._id,
          title: section.title,
          isFreePreview: section.isFreePreview,
          banks: visibleBanks,
        });
      }
    }

    const lockedBanks = banks.filter((b) => {
      const inFreeSection = b.quizSection && freeSectionIds.has(b.quizSection.toString());
      return !inFreeSection && !b.isFreePreview;
    });
    const lockedBankCount = lockedBanks.length;
    const lockedQuestionCount = lockedBanks.reduce(
      (sum, b) => sum + (b.questions?.length ?? 0),
      0,
    );

    res.status(200).json({
      success: true,
      data: { course, sections: result, lockedBankCount, lockedQuestionCount },
    });
  },
);
