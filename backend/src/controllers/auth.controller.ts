import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { generateToken, sendTokenCookie, clearTokenCookie } from '../utils/jwt';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary';
import { disconnectUserSockets } from '../socket/index';
import { clearFailedLogins, isLoginLocked, recordFailedLogin } from '../utils/loginThrottle';

const MIN_PASSWORD_LENGTH = 6;
// bcrypt only uses the first 72 bytes; longer input is refused instead of silently cut.
const MAX_PASSWORD_LENGTH = 72;
// Compared against when the email is unknown, so both cases take the same time (no account probing).
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('timing-equaliser-not-a-real-password', 12);
// One second back, so the token issued right after a password change (same second) stays valid.
const PASSWORD_CHANGE_CLOCK_SKEW_MS = 1000;

// Rejects objects such as { "$ne": null } (NoSQL operator injection) and empty values.
const isFilledString = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';
const isOptionalString = (value: unknown): value is string | undefined =>
  value === undefined || typeof value === 'string';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body as {
    name: string;
    email: string;
    password: string;
  };

  if (!isFilledString(name) || !isFilledString(email) || !isFilledString(password)) {
    throw new AppError('Name, email and password are required', 400);
  }
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    throw new AppError(`Password must be ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} characters`, 400);
  }
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) throw new AppError('Email is already registered', 400);

  const hashed = await bcrypt.hash(password, 12);
  const user = await User.create({ name: name.trim(), email: normalizedEmail, password: hashed });

  const token = generateToken(String(user._id));
  sendTokenCookie(token, res);

  res.status(201).json({
    success: true,
    message: 'Registered successfully',
    token,
    data: { _id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  if (!isFilledString(email) || !isFilledString(password)) {
    throw new AppError('Email and password are required', 400);
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (isLoginLocked(normalizedEmail)) {
    throw new AppError('Too many failed login attempts. Please try again later.', 429);
  }
  // Counted before the slow password check, so parallel requests cannot all slip past the limit
  recordFailedLogin(normalizedEmail);

  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  const match = await bcrypt.compare(password, user?.password ?? DUMMY_PASSWORD_HASH);
  if (!user || !match) throw new AppError('Invalid credentials', 401);
  clearFailedLogins(normalizedEmail);

  const token = generateToken(String(user._id));
  sendTokenCookie(token, res);

  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    token,
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
  const { name, email, currentPassword, newPassword, removeAvatar, isCommunityProfilePrivate } = req.body as {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
    removeAvatar?: string;
    isCommunityProfilePrivate?: string;
  };

  if (![name, email, currentPassword, newPassword].every(isOptionalString)) {
    throw new AppError('Invalid profile data', 400);
  }

  const user = await User.findById(req.user._id).select('+password +avatarPublicId');
  if (!user) throw new AppError('User not found', 404);
  let passwordChanged = false;

  if (name !== undefined) {
    if (!name.trim()) throw new AppError('Name is required', 400);
    user.name = name.trim();
  }

  if (email !== undefined) {
    if (user.role !== 'Student') {
      throw new AppError('Only students can update their email from profile', 403);
    }
    if (!email.trim()) throw new AppError('Email is required', 400);
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail !== user.email) {
      // A stolen session must not be able to move the account to another email
      if (!currentPassword) throw new AppError('Current password is required', 400);
      if (!(await bcrypt.compare(currentPassword, user.password))) {
        throw new AppError('Current password is incorrect', 400);
      }
      const existing = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      });
      if (existing) throw new AppError('Email is already in use', 400);
      user.email = normalizedEmail;
    }
  }

  if (newPassword?.trim()) {
    if (!currentPassword) throw new AppError('Current password is required', 400);
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) throw new AppError('Current password is incorrect', 400);
    if (newPassword.length < MIN_PASSWORD_LENGTH || newPassword.length > MAX_PASSWORD_LENGTH) {
      throw new AppError(`New password must be ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} characters`, 400);
    }
    // Hashed exactly as typed: login compares the untrimmed input
    user.password = await bcrypt.hash(newPassword, 12);
    // Signs out every other session; this one gets a fresh token below
    user.passwordChangedAt = new Date(Date.now() - PASSWORD_CHANGE_CLOCK_SKEW_MS);
    passwordChanged = true;
  }

  if (req.file) {
    // Upload first: a rejected file must not remove the current avatar
    const result = await uploadToCloudinary(req.file.buffer, 'medhabee/users');
    if (user.avatarPublicId) await deleteFromCloudinary(user.avatarPublicId);
    user.avatar = result.url;
    user.avatarPublicId = result.publicId;
  } else if (removeAvatar === 'true') {
    if (user.avatarPublicId) await deleteFromCloudinary(user.avatarPublicId);
    user.avatar = undefined;
    user.avatarPublicId = undefined;
  }

  if (isCommunityProfilePrivate !== undefined) {
    user.isCommunityProfilePrivate = isCommunityProfilePrivate === 'true';
  }

  await user.save();
  if (passwordChanged) {
    // Live chat connections of other devices end too; this browser reconnects with the fresh token
    disconnectUserSockets(String(user._id));
    sendTokenCookie(generateToken(String(user._id)), res);
  }

  const safeUser = await User.findById(user._id);
  res.status(200).json({
    success: true,
    message: 'Profile updated',
    data: safeUser,
  });
});
