import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.model';
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
