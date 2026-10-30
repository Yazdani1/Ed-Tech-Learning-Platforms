import jwt from 'jsonwebtoken';
import type { Response } from 'express';
import { config } from '../config/env';

export const generateToken = (userId: string): string =>
  jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpire as jwt.SignOptions['expiresIn'],
  });

const isProduction = config.nodeEnv === 'production';

export const sendTokenCookie = (token: string, res: Response): void => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'lax' : 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearTokenCookie = (res: Response): void => {
  res.cookie('token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'lax' : 'strict',
    expires: new Date(0),
  });
};
