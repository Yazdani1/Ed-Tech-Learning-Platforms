import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import {
  QuizBank,
  type IQuizBank,
  type IQuizQuestion,
  type QuizContextType,
} from '../models/QuizBank.model';
import { QuizSection } from '../models/QuizSection.model';
import { QuizAttempt } from '../models/QuizAttempt.model';
import { Course } from '../models/Course.model';
import { Teacher } from '../models/Teacher.model';
import type { IUser } from '../models/User.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { canAccessCourseContent, isCourseTeacher, isStaff } from '../utils/courseAccess';
import { escapeRegex } from '../utils/escapeRegex';

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

/** selectedOptionIndices must be an array of unique integers 0–3 (may be empty). */
function assertValidSelection(selected: unknown): asserts selected is number[] {
  if (
    !Array.isArray(selected) ||
    selected.some((i) => !Number.isInteger(i) || i < 0 || i > 3) ||
    new Set(selected).size !== selected.length
  )
    throw new AppError('selectedOptionIndices must be an array of unique values 0–3', 400);
}

/** A question without its correct answers and option explanations. */
function hideAnswer(q: IQuizQuestion) {
  return {
    _id: q._id,
    question: q.question,
    order: q.order,
    options: q.options.map((o) => ({ _id: o._id, text: o.text })),
  };
}

/** A bank as a plain object; questions not in `revealed` lose their answers. */
function toSafeBank(bank: IQuizBank, revealed: Set<string>) {
  const obj = bank.toObject();
  return {
    ...obj,
    questions: obj.questions.map((q: IQuizQuestion) =>
      revealed.has(q._id.toString()) ? q : hideAnswer(q),
    ),
  };
}

/** Ids of the banks that are free preview (the bank itself or its quiz section). */
async function freePreviewBankIds(banks: IQuizBank[]): Promise<Set<string>> {
  const sectionIds = banks.flatMap((b) => (b.quizSection ? [b.quizSection] : []));
  const freeSections = await QuizSection.find(
    { _id: { $in: sectionIds }, isFreePreview: true },
    '_id',
  );
  const freeSectionIds = new Set(freeSections.map((s) => s._id.toString()));
  return new Set(
    banks
      .filter((b) => b.isFreePreview || (b.quizSection && freeSectionIds.has(b.quizSection.toString())))
      .map((b) => b._id.toString()),
  );
}

/** Per course: may the user read its quizzes, and may they see the answers (staff, course teacher). */
async function courseQuizAccess(user: IUser, courseId: Types.ObjectId | string) {
  const course = await Course.findById(courseId, '_id teachers');
  if (!course) return { access: false, seesAnswers: false };
  const seesAnswers = isStaff(user) || (await isCourseTeacher(user, course));
  const access = seesAnswers || (await canAccessCourseContent(user, course));
  return { access, seesAnswers };
}

/**
 * The banks the user may read: banks of courses they can access, plus free-preview banks. Answers of
 * questions the user has not answered yet are hidden unless they are staff or the course's teacher.
 * 403 when banks were found but none may be read.
 */
async function readableBanks(user: IUser, banks: IQuizBank[]) {
  if (banks.length === 0) return [];
  const freeIds = await freePreviewBankIds(banks);
  const accessByCourse = new Map<string, { access: boolean; seesAnswers: boolean }>();
  for (const courseId of new Set(banks.map((b) => b.course.toString()))) {
    accessByCourse.set(courseId, await courseQuizAccess(user, courseId));
  }
  const visible = banks.filter(
    (b) => accessByCourse.get(b.course.toString())?.access || freeIds.has(b._id.toString()),
  );
  if (visible.length === 0) throw new AppError('You do not have access to this course', 403);

  const attempts = await QuizAttempt.find({
    student: user._id,
    quizBank: { $in: visible.map((b) => b._id) },
  });
  const answeredByBank = new Map(
    attempts.map((a) => [a.quizBank.toString(), new Set(a.answers.map((x) => x.questionId.toString()))]),
  );
  return visible.map((b) =>
    accessByCourse.get(b.course.toString())?.seesAnswers
      ? b
      : toSafeBank(b, answeredByBank.get(b._id.toString()) ?? new Set()),
  );
}

/** 404 unknown bank, 403 when the user may not use it (not free preview and no course access). */
async function findUsableBank(user: IUser, bankId: string): Promise<IQuizBank> {
  const bank = await QuizBank.findById(bankId);
  if (!bank) throw new AppError('Quiz bank not found', 404);
  await readableBanks(user, [bank]);
  return bank;
}

/** 400 when an optional text field is sent but is not a string (null clears it). */
function assertOptionalText(value: unknown, field: string): asserts value is string | null | undefined {
  if (value !== undefined && value !== null && typeof value !== 'string')
    throw new AppError(`${field} must be text`, 400);
}

/** Exactly 4 options, each with a text and an optional explanation (both text). */
function assertOptions(options: unknown): asserts options is { text: string; explanation?: string }[] {
  if (!Array.isArray(options) || options.length !== 4)
    throw new AppError('Exactly 4 options are required', 400);
  for (const o of options) {
    if (typeof o !== 'object' || o === null || typeof (o as { text?: unknown }).text !== 'string')
      throw new AppError('Each option needs a text', 400);
    assertOptionalText((o as { explanation?: unknown }).explanation, 'Option explanation');
  }
}

/** Public quiz pages only show Published + Public courses. */
const PUBLIC_COURSE = { status: 'Published', visibility: 'Public' } as const;

function assertCourseId(courseId: unknown): asserts courseId is string {
  if (typeof courseId !== 'string' || !Types.ObjectId.isValid(courseId))
    throw new AppError('Invalid course id', 400);
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

  if (!courseId || typeof title !== 'string' || !title.trim())
    throw new AppError('course and title are required', 400);
  assertOptionalText(description, 'Description');

  if (!quizSection && (!contextType || !contextId))
    throw new AppError('quizSection or contextType+contextId is required', 400);

  if (contextType && !['Section', 'Announcement', 'Course'].includes(contextType))
    throw new AppError('contextType must be Section, Announcement, or Course', 400);

  assertCourseId(courseId);
  for (const id of [quizSection, contextId]) {
    if (id !== undefined && (typeof id !== 'string' || !Types.ObjectId.isValid(id)))
      throw new AppError('Invalid quizSection or contextId', 400);
  }
  if (!(await Course.exists({ _id: courseId }))) throw new AppError('Course not found', 404);

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
  const { courseId } = req.params;
  assertCourseId(courseId);
  if (!(await Course.exists({ _id: courseId }))) throw new AppError('Course not found', 404);
  const found = await QuizBank.find({ course: courseId })
    .populate('createdBy', 'name avatar role')
    .sort({ createdAt: 1 });
  if (found.length === 0 && !(await courseQuizAccess(req.user, courseId)).access)
    throw new AppError('You do not have access to this course', 403);
  const banks = await readableBanks(req.user, found);
  res.status(200).json({ success: true, data: banks, total: banks.length });
});

export const getContextQuizBanks = asyncHandler(async (req: Request, res: Response) => {
  const { contextType, contextId } = req.params;
  if (!['Section', 'Announcement', 'Course'].includes(String(contextType)))
    throw new AppError('contextType must be Section, Announcement, or Course', 400);
  const found = await QuizBank.find({
    contextType: contextType as QuizContextType,
    contextId,
  })
    .populate('createdBy', 'name avatar role')
    .sort({ createdAt: 1 });
  const banks = await readableBanks(req.user, found);
  res.status(200).json({ success: true, data: banks, total: banks.length });
});

export const getQuizBank = asyncHandler(async (req: Request, res: Response) => {
  const bank = await QuizBank.findById(req.params.id).populate('createdBy', 'name avatar role');
  if (!bank) throw new AppError('Quiz bank not found', 404);
  const [data] = await readableBanks(req.user, [bank]);
  res.status(200).json({ success: true, data });
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
  if (title !== undefined && (typeof title !== 'string' || !title.trim()))
    throw new AppError('Title is required', 400);
  assertOptionalText(description, 'Description');
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

  if (typeof question !== 'string' || !question.trim()) throw new AppError('Question text is required', 400);
  assertOptions(options);
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

  if (question !== undefined && (typeof question !== 'string' || !question.trim()))
    throw new AppError('Question text is required', 400);
  if (question !== undefined) bank.questions[qIndex].question = question.trim();
  if (options !== undefined) {
    assertOptions(options);
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

export const getCourseAttempts = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  assertCourseId(courseId);
  if (!(await Course.exists({ _id: courseId }))) throw new AppError('Course not found', 404);
  const filter: Record<string, unknown> = { student: req.user._id, course: courseId };
  if (!(await courseQuizAccess(req.user, courseId)).access) {
    const freeIds = await freePreviewBankIds(await QuizBank.find({ course: courseId }));
    if (freeIds.size === 0) throw new AppError('You do not have access to this course', 403);
    filter.quizBank = { $in: [...freeIds] };
  }
  const attempts = await QuizAttempt.find(filter);
  res.status(200).json({ success: true, data: attempts });
});

export const getMyAttempt = asyncHandler(async (req: Request, res: Response) => {
  const bank = await findUsableBank(req.user, String(req.params.id));
  const attempt = await QuizAttempt.findOne({
    student: req.user._id,
    quizBank: bank._id,
  });
  res.status(200).json({ success: true, data: attempt ?? null });
});

export const submitAnswer = asyncHandler(async (req: Request, res: Response) => {
  const { questionId, selectedOptionIndices } = req.body as {
    questionId: string;
    selectedOptionIndices: unknown;
  };

  if (!questionId || typeof questionId !== 'string') throw new AppError('questionId is required', 400);
  assertValidSelection(selectedOptionIndices);

  const bank = await findUsableBank(req.user, String(req.params.id));

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

  // One answer per question: changing it after seeing the result would make the score meaningless.
  if (existingIdx >= 0)
    throw new AppError('Question already answered; reset the attempt to try again', 409);
  attempt.answers.push({
    questionId: new Types.ObjectId(questionId),
    selectedOptionIndices,
    isCorrect,
  });

  await attempt.save();
  res.status(200).json({ success: true, data: attempt });
});

export const resetAttempt = asyncHandler(async (req: Request, res: Response) => {
  const bank = await findUsableBank(req.user, String(req.params.id));
  await QuizAttempt.findOneAndDelete({
    student: req.user._id,
    quizBank: bank._id,
  });
  res.status(200).json({ success: true, message: 'Attempt reset' });
});

// ── Public (no auth) ────────────────────────────────────────────────────────

export const getPublicCoursesWithQuizzes = asyncHandler(
  async (req: Request, res: Response) => {
    const query = req.query as Record<string, unknown>;
    const asText = (value: unknown): string | undefined =>
      typeof value === 'string' ? value : undefined;
    const search = asText(query.search);
    const categories = asText(query.categories);
    const courseTypes = asText(query.courseTypes);
    const pricing = asText(query.pricing);

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

    const filter: Record<string, any> = {
      _id: { $in: courseIds },
      ...PUBLIC_COURSE,
    };

    if (search?.trim()) {
      filter.title = { $regex: escapeRegex(search.trim()), $options: 'i' };
    }

    if (categories) {
      const ids = categories
        .split(',')
        .map((s) => s.trim())
        .filter((s) => Types.ObjectId.isValid(s))
        .map((s) => new Types.ObjectId(s));
      if (ids.length > 0) filter.category = { $in: ids };
    }

    if (courseTypes) {
      const ids = courseTypes
        .split(',')
        .map((s) => s.trim())
        .filter((s) => Types.ObjectId.isValid(s))
        .map((s) => new Types.ObjectId(s));
      if (ids.length > 0) filter.courseType = { $in: ids };
    }

    if (pricing) {
      const values = pricing
        .split(',')
        .map((s) => s.trim())
        .filter((s) => ['Free', 'Paid'].includes(s));
      if (values.length > 0) filter.pricing = { $in: values };
    }

    const courses = await Course.find(
      filter,
      'title subtitle coverImage pricing price listPrice discountPrice discountPercent includedInSubscription',
    ).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: courses });
  },
);

export const getPublicCourseQuizBanks = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseId } = req.params;

    assertCourseId(courseId);
    const course = await Course.findOne(
      { _id: courseId, ...PUBLIC_COURSE },
      'title subtitle coverImage pricing price listPrice discountPrice discountPercent includedInSubscription',
    );
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
          banks: visibleBanks.map((b) => toSafeBank(b, new Set())),
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

/** Free-preview practice for guests: checks one answer, stores nothing. */
export const checkPublicAnswer = asyncHandler(async (req: Request, res: Response) => {
  const { selectedOptionIndices } = req.body as { selectedOptionIndices: unknown };
  assertValidSelection(selectedOptionIndices);

  const bank = await QuizBank.findById(req.params.id);
  if (!bank || !(await freePreviewBankIds([bank])).has(bank._id.toString()))
    throw new AppError('Quiz bank not found', 404);
  if (!(await Course.exists({ _id: bank.course, ...PUBLIC_COURSE })))
    throw new AppError('Quiz bank not found', 404);

  const q = bank.questions.find((q) => q._id.toString() === req.params.qId);
  if (!q) throw new AppError('Question not found in this quiz bank', 404);

  const isCorrect =
    selectedOptionIndices.length > 0 &&
    arraysEqualSorted(selectedOptionIndices, q.correctOptionIndices);

  res.status(200).json({
    success: true,
    data: {
      isCorrect,
      correctOptionIndices: q.correctOptionIndices,
      explanations: q.options.map((o) => o.explanation ?? null),
    },
  });
});
