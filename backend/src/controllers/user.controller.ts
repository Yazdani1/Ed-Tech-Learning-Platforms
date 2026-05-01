import type { Request, Response } from 'express';
import { User } from '../models/User.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import type { UserRole } from '../types/index';

export const getUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: users, total: users.length });
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

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  res.status(200).json({ success: true, message: 'User deleted' });
});
