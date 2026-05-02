import type { Request, Response, NextFunction } from 'express';
import { Error as MongooseError } from 'mongoose';
import { AppError } from '../utils/AppError';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }

  // Mongoose duplicate key (MongoDB sends numeric 11000)
  if ('code' in err && Number((err as { code: unknown }).code) === 11000) {
    res.status(400).json({ success: false, message: 'Duplicate field value entered' });
    return;
  }

  // Mongoose validation error
  if (err instanceof MongooseError.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message).join(', ');
    res.status(400).json({ success: false, message: messages });
    return;
  }

  // Mongoose bad ObjectId
  if (err instanceof MongooseError.CastError) {
    res.status(400).json({ success: false, message: `Invalid ${err.path}: ${String(err.value)}` });
    return;
  }

  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack, error: err.message }),
  });
};
