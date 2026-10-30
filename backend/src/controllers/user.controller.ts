import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import type { PipelineStage } from 'mongoose';
import { User } from '../models/User.model';
import { Enrollment } from '../models/Enrollment.model';
import { Subscription } from '../models/Subscription.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import type { UserRole } from '../types/index';
import { escapeRegex } from '../utils/escapeRegex';
import { generateToken, sendTokenCookie } from '../utils/jwt';
import { disconnectUserSockets } from '../socket/index';

// Only a Super Admin may create, promote to, or change Admin and Super Admin accounts (no privilege
// escalation, no admin taking over another admin's account).
const PROTECTED_ROLES: UserRole[] = ['Super Admin', 'Admin'];
const assertCanManageSuperAdmin = (actorRole: UserRole, ...roles: (UserRole | undefined)[]): void => {
  if (actorRole !== 'Super Admin' && roles.some((role) => role !== undefined && PROTECTED_ROLES.includes(role))) {
    throw new AppError('Only a Super Admin can manage Admin and Super Admin accounts', 403);
  }
};

// The system must always keep one Super Admin (nobody could manage it otherwise).
const assertNotLastSuperAdmin = async (target: { role: UserRole }, newRole?: UserRole): Promise<void> => {
  if (target.role !== 'Super Admin' || newRole === 'Super Admin') return;
  if ((await User.countDocuments({ role: 'Super Admin' })) <= 1) {
    throw new AppError('At least one Super Admin must remain', 400);
  }
};

const MIN_PASSWORD_LENGTH = 6;
// bcrypt only uses the first 72 bytes
const MAX_PASSWORD_LENGTH = 72;
const assertPasswordLength = (password: string): void => {
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    throw new AppError(`Password must be ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} characters`, 400);
  }
};

// One second back, so a token issued in the same second as the change is not treated as older.
const PASSWORD_CHANGE_CLOCK_SKEW_MS = 1000;

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body as { name: string; email: string; password: string; role?: UserRole };
  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string' || !name.trim() || !email.trim() || !password) {
    throw new AppError('Name, email and password are required', 400);
  }
  assertCanManageSuperAdmin(req.user.role, role);
  assertPasswordLength(password);
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) throw new AppError('Email is already in use', 400);

  const hashed = await bcrypt.hash(password, 12);
  const validRoles: UserRole[] = ['Super Admin', 'Admin', 'Moderator', 'Teacher', 'Student'];
  const user = await User.create({ name: name.trim(), email: normalizedEmail, password: hashed, role: role && validRoles.includes(role) ? role : 'Student' });

  res.status(201).json({ success: true, message: 'User created', data: { _id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt } });
});

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const {
    search,
    role,
    page,
    limit,
    subscriptionPlan,
    subscriptionStatus,
    enrollmentFilter,
    spendingFilter,
    minTotalSpent,
    maxTotalSpent,
    minPaidCourseSpend,
    maxPaidCourseSpend,
    minSubscriptionSpend,
    maxSubscriptionSpend,
  } = req.query as Record<string, string>;

  const currentPage = Math.max(Number(page) || 1, 1);
  const perPage = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const validRoles: UserRole[] = ['Super Admin', 'Admin', 'Moderator', 'Teacher', 'Student'];
  const userFilter: Record<string, unknown> = {};
  if (typeof search === 'string' && search.trim()) {
    const pattern = escapeRegex(search.trim());
    userFilter.$or = [
      { name: { $regex: pattern, $options: 'i' } },
      { email: { $regex: pattern, $options: 'i' } },
    ];
  }
  if (role && validRoles.includes(role as UserRole)) {
    userFilter.role = role;
  }

  const createPagination = (total: number, safePage: number) => {
    const totalPages = Math.max(Math.ceil(total / perPage), 1);
    return {
      page: safePage,
      limit: perPage,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1,
    };
  };

  const totalUsers = await User.countDocuments();
  const advancedFilterActive =
    req.user.role === 'Super Admin' &&
    Boolean(
      subscriptionPlan ||
        subscriptionStatus ||
        enrollmentFilter ||
        spendingFilter ||
        minTotalSpent ||
        maxTotalSpent ||
        minPaidCourseSpend ||
        maxPaidCourseSpend ||
        minSubscriptionSpend ||
        maxSubscriptionSpend,
    );

  if (req.user.role !== 'Super Admin' || !advancedFilterActive) {
    const total = await User.countDocuments(userFilter);
    const totalPages = Math.max(Math.ceil(total / perPage), 1);
    const safePage = Math.min(currentPage, totalPages);
    const users = await User.find(userFilter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * perPage)
      .limit(perPage);

    if (req.user.role !== 'Super Admin') {
      res.status(200).json({
        success: true,
        data: users,
        total,
        totalUsers,
        pagination: createPagination(total, safePage),
      });
      return;
    }

    const userIds = users.map((user) => user._id);
    const enrollmentCounts = await Enrollment.aggregate<{
      _id: { student: string; enrollmentType: 'free' | 'paid' | 'subscription' };
      count: number;
    }>([
      { $match: { student: { $in: userIds } } },
      {
        $group: {
          _id: { student: '$student', enrollmentType: '$enrollmentType' },
          count: { $sum: 1 },
        },
      },
    ]);
    const paidCourseSpend = await Enrollment.aggregate<{ _id: string; amount: number }>([
      { $match: { student: { $in: userIds }, enrollmentType: 'paid' } },
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'course',
        },
      },
      { $unwind: '$course' },
      {
        $group: {
          _id: '$student',
          amount: { $sum: { $ifNull: ['$paidPrice', { $ifNull: ['$course.price', 0] }] } },
        },
      },
    ]);
    const subscriptionSpend = await Subscription.aggregate<{ _id: string; amount: number }>([
      { $match: { user: { $in: userIds } } },
      {
        $lookup: {
          from: 'subscriptionplanconfigs',
          localField: 'plan',
          foreignField: 'plan',
          as: 'planConfig',
        },
      },
      {
        $unwind: {
          path: '$planConfig',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: '$user',
          amount: { $sum: { $ifNull: ['$pricePaid', { $ifNull: ['$planConfig.price', 0] }] } },
        },
      },
    ]);

    const countsByUser = enrollmentCounts.reduce<Record<string, { free: number; paid: number; subscription: number; total: number }>>(
      (acc, item) => {
        const userId = String(item._id.student);
        const current = acc[userId] ?? { free: 0, paid: 0, subscription: 0, total: 0 };
        current[item._id.enrollmentType] = item.count;
        current.total += item.count;
        acc[userId] = current;
        return acc;
      },
      {},
    );
    const paidCourseSpendByUser = paidCourseSpend.reduce<Record<string, number>>((acc, item) => {
      acc[String(item._id)] = item.amount;
      return acc;
    }, {});
    const subscriptionSpendByUser = subscriptionSpend.reduce<Record<string, number>>((acc, item) => {
      acc[String(item._id)] = item.amount;
      return acc;
    }, {});

    const usersWithSummary = users.map((user) => {
      const userObject = user.toObject();
      const paidCourseAmount = paidCourseSpendByUser[String(user._id)] ?? 0;
      const subscriptionAmount = subscriptionSpendByUser[String(user._id)] ?? 0;
      return {
        ...userObject,
        enrollmentSummary: countsByUser[String(user._id)] ?? {
          free: 0,
          paid: 0,
          subscription: 0,
          total: 0,
        },
        spendingSummary: {
          paidCourses: paidCourseAmount,
          subscriptions: subscriptionAmount,
          total: paidCourseAmount + subscriptionAmount,
        },
      };
    });

    res.status(200).json({
      success: true,
      data: usersWithSummary,
      total,
      totalUsers,
      pagination: createPagination(total, safePage),
    });
    return;
  }

  const basePipeline: PipelineStage[] = [
    { $match: userFilter },
    {
      $lookup: {
        from: 'enrollments',
        localField: '_id',
        foreignField: 'student',
        as: 'enrollments',
      },
    },
    {
      $lookup: {
        from: 'enrollments',
        let: { userId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$student', '$$userId'] },
                  { $eq: ['$enrollmentType', 'paid'] },
                ],
              },
            },
          },
          {
            $lookup: {
              from: 'courses',
              localField: 'course',
              foreignField: '_id',
              as: 'course',
            },
          },
          { $unwind: '$course' },
          {
            $group: {
              _id: '$student',
              amount: { $sum: { $ifNull: ['$paidPrice', { $ifNull: ['$course.price', 0] }] } },
            },
          },
        ],
        as: 'paidCourseSpend',
      },
    },
    {
      $lookup: {
        from: 'subscriptions',
        let: { userId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$user', '$$userId'] } } },
          {
            $lookup: {
              from: 'subscriptionplanconfigs',
              localField: 'plan',
              foreignField: 'plan',
              as: 'planConfig',
            },
          },
          {
            $unwind: {
              path: '$planConfig',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $group: {
              _id: '$user',
              amount: { $sum: { $ifNull: ['$pricePaid', { $ifNull: ['$planConfig.price', 0] }] } },
            },
          },
        ],
        as: 'subscriptionSpend',
      },
    },
    {
      $addFields: {
        enrollmentSummary: {
          free: {
            $size: {
              $filter: {
                input: '$enrollments',
                as: 'enrollment',
                cond: { $eq: ['$$enrollment.enrollmentType', 'free'] },
              },
            },
          },
          paid: {
            $size: {
              $filter: {
                input: '$enrollments',
                as: 'enrollment',
                cond: { $eq: ['$$enrollment.enrollmentType', 'paid'] },
              },
            },
          },
          subscription: {
            $size: {
              $filter: {
                input: '$enrollments',
                as: 'enrollment',
                cond: { $eq: ['$$enrollment.enrollmentType', 'subscription'] },
              },
            },
          },
          total: { $size: '$enrollments' },
        },
        spendingSummary: {
          paidCourses: { $ifNull: [{ $first: '$paidCourseSpend.amount' }, 0] },
          subscriptions: { $ifNull: [{ $first: '$subscriptionSpend.amount' }, 0] },
        },
      },
    },
    {
      $addFields: {
        'spendingSummary.total': {
          $add: ['$spendingSummary.paidCourses', '$spendingSummary.subscriptions'],
        },
      },
    },
  ];

  const now = new Date();
  const advancedMatch: Record<string, unknown> = {};
  if (subscriptionPlan) advancedMatch['activeSubscription.plan'] = subscriptionPlan;
  if (subscriptionStatus === 'active') advancedMatch['activeSubscription.endDate'] = { $gt: now };
  if (subscriptionStatus === 'expired') advancedMatch['activeSubscription.endDate'] = { $lte: now };
  if (subscriptionStatus === 'inactive') advancedMatch['activeSubscription.endDate'] = { $exists: false };

  if (enrollmentFilter === 'has_total') advancedMatch['enrollmentSummary.total'] = { $gt: 0 };
  if (enrollmentFilter === 'none_total') advancedMatch['enrollmentSummary.total'] = 0;
  if (enrollmentFilter === 'has_free') advancedMatch['enrollmentSummary.free'] = { $gt: 0 };
  if (enrollmentFilter === 'none_free') advancedMatch['enrollmentSummary.free'] = 0;
  if (enrollmentFilter === 'has_paid') advancedMatch['enrollmentSummary.paid'] = { $gt: 0 };
  if (enrollmentFilter === 'none_paid') advancedMatch['enrollmentSummary.paid'] = 0;
  if (enrollmentFilter === 'has_subscription') advancedMatch['enrollmentSummary.subscription'] = { $gt: 0 };
  if (enrollmentFilter === 'none_subscription') advancedMatch['enrollmentSummary.subscription'] = 0;

  if (spendingFilter === 'has_total') advancedMatch['spendingSummary.total'] = { $gt: 0 };
  if (spendingFilter === 'none_total') advancedMatch['spendingSummary.total'] = 0;
  if (spendingFilter === 'has_paid_course') advancedMatch['spendingSummary.paidCourses'] = { $gt: 0 };
  if (spendingFilter === 'none_paid_course') advancedMatch['spendingSummary.paidCourses'] = 0;
  if (spendingFilter === 'has_subscription') advancedMatch['spendingSummary.subscriptions'] = { $gt: 0 };
  if (spendingFilter === 'none_subscription') advancedMatch['spendingSummary.subscriptions'] = 0;

  const addNumberRange = (field: string, min?: string, max?: string) => {
    const minValue = min !== undefined && min !== '' ? Number(min) : null;
    const maxValue = max !== undefined && max !== '' ? Number(max) : null;
    const range: Record<string, number> = {};
    if (minValue !== null && Number.isFinite(minValue)) range.$gte = minValue;
    if (maxValue !== null && Number.isFinite(maxValue)) range.$lte = maxValue;
    if (Object.keys(range).length > 0) advancedMatch[field] = range;
  };

  addNumberRange('spendingSummary.total', minTotalSpent, maxTotalSpent);
  addNumberRange('spendingSummary.paidCourses', minPaidCourseSpend, maxPaidCourseSpend);
  addNumberRange('spendingSummary.subscriptions', minSubscriptionSpend, maxSubscriptionSpend);
  if (Object.keys(advancedMatch).length > 0) basePipeline.push({ $match: advancedMatch });

  const countResult = await User.aggregate<{ total: number }>([
    ...basePipeline,
    { $count: 'total' },
  ]);
  const total = countResult[0]?.total ?? 0;
  const totalPages = Math.max(Math.ceil(total / perPage), 1);
  const safePage = Math.min(currentPage, totalPages);
  const users = await User.aggregate([
    ...basePipeline,
    { $sort: { createdAt: -1, _id: -1 } },
    { $skip: (safePage - 1) * perPage },
    { $limit: perPage },
    { $project: { password: 0, enrollments: 0, paidCourseSpend: 0, subscriptionSpend: 0 } },
  ]);

  res.status(200).json({
    success: true,
    data: users,
    total,
    totalUsers,
    pagination: createPagination(total, safePage),
  });
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) throw new AppError('User not found', 404);
  res.status(200).json({ success: true, data: user });
});

export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.body as { role: UserRole };
  const validRoles: UserRole[] = ['Super Admin', 'Admin', 'Moderator', 'Teacher', 'Student'];
  if (!validRoles.includes(role)) throw new AppError('Invalid role', 400);

  const target = await User.findById(req.params.id);
  if (!target) throw new AppError('User not found', 404);
  assertCanManageSuperAdmin(req.user.role, role, target.role);
  await assertNotLastSuperAdmin(target, role);

  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
  if (!user) throw new AppError('User not found', 404);
  if (target.role !== role) disconnectUserSockets(String(user._id));

  res.status(200).json({ success: true, message: 'Role updated', data: user });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    role?: UserRole;
  };
  const validRoles: UserRole[] = ['Super Admin', 'Admin', 'Moderator', 'Teacher', 'Student'];
  const updates: Partial<{
    name: string;
    email: string;
    password: string;
    passwordChangedAt: Date;
    role: UserRole;
  }> = {};
  if (![name, email, password].every((value) => value === undefined || typeof value === 'string')) {
    throw new AppError('Invalid user data', 400);
  }
  const target = await User.findById(req.params.id);
  if (!target) throw new AppError('User not found', 404);
  assertCanManageSuperAdmin(req.user.role, role, target.role);
  if (role !== undefined) await assertNotLastSuperAdmin(target, role);

  if (name !== undefined) {
    if (!name.trim()) throw new AppError('Name is required', 400);
    updates.name = name.trim();
  }

  if (email !== undefined) {
    if (!email.trim()) throw new AppError('Email is required', 400);
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: req.params.id },
    });
    if (existing) throw new AppError('Email is already in use', 400);
    updates.email = normalizedEmail;
  }

  if (role !== undefined) {
    if (!validRoles.includes(role)) throw new AppError('Invalid role', 400);
    updates.role = role;
  }

  if (password !== undefined && password.trim()) {
    assertPasswordLength(password);
    updates.password = await bcrypt.hash(password, 12);
    updates.passwordChangedAt = new Date(Date.now() - PASSWORD_CHANGE_CLOCK_SKEW_MS);
  }

  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).select('-password');
  if (!user) throw new AppError('User not found', 404);
  if (updates.password || (updates.role && updates.role !== target.role)) disconnectUserSockets(String(user._id));
  // An admin who resets their own password stays signed in on this device
  if (updates.password && String(user._id) === String(req.user._id)) sendTokenCookie(generateToken(String(user._id)), res);

  res.status(200).json({ success: true, message: 'User updated', data: user });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const target = await User.findById(req.params.id);
  if (!target) throw new AppError('User not found', 404);
  await assertNotLastSuperAdmin(target);
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  disconnectUserSockets(String(user._id));
  res.status(200).json({ success: true, message: 'User deleted' });
});
