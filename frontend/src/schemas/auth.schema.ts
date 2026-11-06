import { z } from 'zod';

/** Same minimum the backend enforces when a password is changed (auth.controller updateMe). */
export const PASSWORD_MIN_LENGTH = 6;

export const userRoleSchema = z.enum(['Super Admin', 'Admin', 'Moderator', 'Teacher', 'Student']);

/** The signed-in user as GET /api/auth/me and POST /api/auth/login|register return it (fields we use). */
export const userSchema = z.object({
  _id: z.string(),
  name: z.string(),
  email: z.string(),
  role: userRoleSchema,
  avatar: z.string().optional(),
  /** Students only: 123-456-789 */
  studentNumber: z.string().nullish(),
});
export type User = z.infer<typeof userSchema>;

// Validation messages are i18n keys; forms translate them.

/** Same rule as the backend (utils/phone.ts): digits, spaces, dashes, an optional leading "+", 6-20 characters. */
const PHONE_PATTERN = /^(?=.{6,20}$)\+?\d[\d\s-]{4,18}\d$/;

/** An optional contact phone number: empty, or a phone number. */
export const phoneField = z
  .string()
  .trim()
  .refine((value) => value === '' || PHONE_PATTERN.test(value), 'validation.phone');

const emailField = z
  .string()
  .trim()
  .min(1, 'validation.required')
  .pipe(z.email('validation.email'));

/** POST /api/auth/login body. */
export const loginRequestSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'validation.required'),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

/** POST /api/auth/register body (the backend always creates a Student). */
export const registerRequestSchema = z.object({
  name: z.string().trim().min(1, 'validation.required'),
  email: emailField,
  phone: phoneField,
  password: z.string().min(PASSWORD_MIN_LENGTH, 'validation.passwordMin'),
});
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
