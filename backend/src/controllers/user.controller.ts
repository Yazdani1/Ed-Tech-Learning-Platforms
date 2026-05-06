import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.model';
import { Enrollment } from '../models/Enrollment.model';
import { Subscription } from '../models/Subscription.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import type { UserRole } from '../types/index';

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body as { name: string; email: string; password: string; role?: UserRole };
  if (!name || !email || !password) throw new AppError('Name, email and password are required', 400);

  const existing = await User.findOne({ email });
  if (existing) throw new AppError('Email is already in use', 400);

  const hashed = await bcrypt.hash(password, 12);
  const validRoles: UserRole[] = ['Super Admin', 'Admin', 'Moderator', 'Teacher', 'Student'];
  const user = await User.create({ name, email, password: hashed, role: role && validRoles.includes(role) ? role : 'Student' });

  res.status(201).json({ success: true, message: 'User created', data: { _id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt } });
});

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const {
    search,
    role,
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

  const validRoles: UserRole[] = ['Super Admin', 'Admin', 'Moderator', 'Teacher', 'Student'];
  const userFilter: Record<string, unknown> = {};
  if (search?.trim()) {
    userFilter.$or = [
      { name: { $regex: search.trim(), $options: 'i' } },
      { email: { $regex: search.trim(), $options: 'i' } },
    ];
  }
  if (role && validRoles.includes(role as UserRole)) {
    userFilter.role = role;
  }

  const totalUsers = await User.countDocuments();
  const users = await User.find(userFilter).select('-password').sort({ createdAt: -1 });
  if (req.user.role !== 'Super Admin') {
    res.status(200).json({
      success: true,
      data: users,
      total: users.length,
      totalUsers,
    });
    return;
  }

  const enrollmentCounts = await Enrollment.aggregate<{
    _id: { student: string; enrollmentType: 'free' | 'paid' | 'subscription' };
    count: number;
  }>([
    {
      $group: {
        _id: { student: '$student', enrollmentType: '$enrollmentType' },
        count: { $sum: 1 },
      },
    },
  ]);
  const paidCourseSpend = await Enrollment.aggregate<{
    _id: string;
    amount: number;
  }>([
    { $match: { enrollmentType: 'paid' } },
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
        amount: { $sum: { $ifNull: ['$course.price', 0] } },
      },
    },
  ]);
  const subscriptionSpend = await Subscription.aggregate<{
    _id: string;
    amount: number;
  }>([
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
        amount: { $sum: { $ifNull: ['$planConfig.price', 0] } },
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

  const numberFilterMatches = (value: number, min?: string, max?: string) => {
    const minValue = min !== undefined && min !== '' ? Number(min) : null;
    const maxValue = max !== undefined && max !== '' ? Number(max) : null;
    if (minValue !== null && Number.isFinite(minValue) && value < minValue) return false;
    if (maxValue !== null && Number.isFinite(maxValue) && value > maxValue) return false;
    return true;
  };

  const usersWithEnrollmentSummary = users.map((user) => {
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

  const now = new Date();
  const filteredUsers = usersWithEnrollmentSummary.filter((user) => {
    const enrollment = user.enrollmentSummary;
    const spending = user.spendingSummary;
    const activeSubscription = user.activeSubscription;

    if (subscriptionPlan && activeSubscription?.plan !== subscriptionPlan) return false;

    if (subscriptionStatus === 'active' && (!activeSubscription?.endDate || new Date(activeSubscription.endDate) <= now)) return false;
    if (subscriptionStatus === 'expired' && (!activeSubscription?.endDate || new Date(activeSubscription.endDate) > now)) return false;
    if (subscriptionStatus === 'inactive' && activeSubscription?.endDate) return false;

    if (enrollmentFilter === 'has_total' && enrollment.total === 0) return false;
    if (enrollmentFilter === 'none_total' && enrollment.total > 0) return false;
    if (enrollmentFilter === 'has_free' && enrollment.free === 0) return false;
    if (enrollmentFilter === 'none_free' && enrollment.free > 0) return false;
    if (enrollmentFilter === 'has_paid' && enrollment.paid === 0) return false;
    if (enrollmentFilter === 'none_paid' && enrollment.paid > 0) return false;
    if (enrollmentFilter === 'has_subscription' && enrollment.subscription === 0) return false;
    if (enrollmentFilter === 'none_subscription' && enrollment.subscription > 0) return false;

    if (spendingFilter === 'has_total' && spending.total <= 0) return false;
    if (spendingFilter === 'none_total' && spending.total > 0) return false;
    if (spendingFilter === 'has_paid_course' && spending.paidCourses <= 0) return false;
    if (spendingFilter === 'none_paid_course' && spending.paidCourses > 0) return false;
    if (spendingFilter === 'has_subscription' && spending.subscriptions <= 0) return false;
    if (spendingFilter === 'none_subscription' && spending.subscriptions > 0) return false;

    if (!numberFilterMatches(spending.total, minTotalSpent, maxTotalSpent)) return false;
    if (!numberFilterMatches(spending.paidCourses, minPaidCourseSpend, maxPaidCourseSpend)) return false;
    if (!numberFilterMatches(spending.subscriptions, minSubscriptionSpend, maxSubscriptionSpend)) return false;

    return true;
  });

  res.status(200).json({
    success: true,
    data: filteredUsers,
    total: filteredUsers.length,
    totalUsers,
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

  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
  if (!user) throw new AppError('User not found', 404);

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
    role: UserRole;
  }> = {};

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
    updates.password = await bcrypt.hash(password, 12);
  }

  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).select('-password');
  if (!user) throw new AppError('User not found', 404);

  res.status(200).json({ success: true, message: 'User updated', data: user });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  res.status(200).json({ success: true, message: 'User deleted' });
});
