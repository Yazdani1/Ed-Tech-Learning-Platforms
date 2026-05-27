import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { User } from '../models/User.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import type { UserRole } from '../types/index';

interface JwtPayload {
  id: string;
}

export const protect = asyncHandler(async (req, _res, next) => {
  let token: string | undefined = req.cookies.token as string | undefined;
  if (!token) {
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) token = auth.slice(7);
  }
  if (!token) throw new AppError('Not authorized, please login', 401);

  const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
  const user = await User.findById(decoded.id).select('-password');
  if (!user) throw new AppError('User no longer exists', 401);

  req.user = user;
  next();
});

export const optionalProtect = asyncHandler(async (req, _res, next) => {
  let token: string | undefined = req.cookies.token as string | undefined;
  if (!token) {
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) token = auth.slice(7);
  }

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    const user = await User.findById(decoded.id).select('-password');
    if (user) req.user = user;
  } catch {
    // Public endpoints should still work for guests with expired tokens.
  }

  next();
});

export const authorize =
  (...roles: UserRole[]) =>
  asyncHandler(async (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError(`Role '${req.user.role}' is not authorized for this action`, 403);
    }
    next();
  });
