import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { generateToken, sendTokenCookie, clearTokenCookie } from '../utils/jwt';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body as {
    name: string;
    email: string;
    password: string;
  };

  if (!name || !email || !password) throw new AppError('Name, email and password are required', 400);

  const existing = await User.findOne({ email });
  if (existing) throw new AppError('Email is already registered', 400);

  const hashed = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, password: hashed });

  const token = generateToken(String(user._id));
  sendTokenCookie(token, res);

  res.status(201).json({
    success: true,
    message: 'Registered successfully',
    data: { _id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) throw new AppError('Email and password are required', 400);

  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new AppError('Invalid credentials', 401);

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new AppError('Invalid credentials', 401);

  const token = generateToken(String(user._id));
  sendTokenCookie(token, res);

  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    data: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
  });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  clearTokenCookie(res);
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({ success: true, data: user });
});
