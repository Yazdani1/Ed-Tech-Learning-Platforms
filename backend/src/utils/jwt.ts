import jwt from 'jsonwebtoken';
import type { Response } from 'express';
import { config } from '../config/env';

export const generateToken = (userId: string): string =>
  jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpire as jwt.SignOptions['expiresIn'],
  });

export const sendTokenCookie = (token: string, res: Response): void => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearTokenCookie = (res: Response): void => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
};
