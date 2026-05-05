import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { generateToken, sendTokenCookie, clearTokenCookie } from '../utils/jwt';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary';

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

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, currentPassword, newPassword, removeAvatar } = req.body as {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
    removeAvatar?: string;
  };

  const user = await User.findById(req.user._id).select('+password +avatarPublicId');
  if (!user) throw new AppError('User not found', 404);

  if (name !== undefined) {
    if (!name.trim()) throw new AppError('Name is required', 400);
    user.name = name.trim();
  }

  if (email !== undefined) {
    if (!email.trim()) throw new AppError('Email is required', 400);
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: user._id },
    });
    if (existing) throw new AppError('Email is already in use', 400);
    user.email = normalizedEmail;
  }

  if (newPassword?.trim()) {
    if (!currentPassword) throw new AppError('Current password is required', 400);
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) throw new AppError('Current password is incorrect', 400);
    if (newPassword.trim().length < 6) {
      throw new AppError('New password must be at least 6 characters', 400);
    }
    user.password = await bcrypt.hash(newPassword.trim(), 12);
  }

  if (req.file) {
    if (user.avatarPublicId) await deleteFromCloudinary(user.avatarPublicId);
    const result = await uploadToCloudinary(req.file.buffer, 'medhabee/users');
    user.avatar = result.url;
    user.avatarPublicId = result.publicId;
  } else if (removeAvatar === 'true') {
    if (user.avatarPublicId) await deleteFromCloudinary(user.avatarPublicId);
    user.avatar = undefined;
    user.avatarPublicId = undefined;
  }

  await user.save();

  const safeUser = await User.findById(user._id);
  res.status(200).json({
    success: true,
    message: 'Profile updated',
    data: safeUser,
  });
});
