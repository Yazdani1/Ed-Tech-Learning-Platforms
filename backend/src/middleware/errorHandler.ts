import type { Request, Response, NextFunction } from 'express';
import { Error as MongooseError } from 'mongoose';
import { MulterError } from 'multer';
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

  // Body parser errors (malformed JSON, body too large) carry their own 4xx status
  const status = (err as { status?: unknown }).status;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    res.status(status).json({ success: false, message: status === 413 ? 'Request body is too large' : 'Invalid request body' });
    return;
  }

  // Upload limits (too many files, file too large): the client's fault, not a server error
  if (err instanceof MulterError) {
    res.status(400).json({ success: false, message: err.message });
    return;
  }

  // Mongoose validation error (cast/enum messages would echo the input: only the field name is shown)
  if (err instanceof MongooseError.ValidationError) {
    const messages = Object.values(err.errors)
      .map((e) => (e.kind === 'required' ? e.message : `Invalid ${e.path}`))
      .join(', ');
    res.status(400).json({ success: false, message: messages });
    return;
  }

  // Mongoose bad ObjectId
  if (err instanceof MongooseError.CastError) {
    res.status(400).json({ success: false, message: `Invalid ${err.path}` });
    return;
  }

  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack, error: err.message }),
  });
};
