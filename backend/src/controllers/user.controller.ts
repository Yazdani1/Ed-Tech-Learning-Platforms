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
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  if (req.user.role !== 'Super Admin') {
    res.status(200).json({ success: true, data: users, total: users.length });
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

  res.status(200).json({ success: true, data: usersWithEnrollmentSummary, total: users.length });
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
