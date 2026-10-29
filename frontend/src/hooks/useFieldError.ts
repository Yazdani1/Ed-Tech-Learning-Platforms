'use client';

import { useTranslation } from 'react-i18next';

import { PASSWORD_MIN_LENGTH } from '@/schemas/auth.schema';

import type { FieldError } from 'react-hook-form';

interface FieldErrorProps {
  error: boolean;
  helperText?: string;
}

/** Turns a React Hook Form error (its message is an i18n key from a Zod schema) into TextField props. */
export const useFieldError = (): ((error: FieldError | undefined) => FieldErrorProps) => {
  const { t } = useTranslation();
  return (error) =>
    error?.message
      ? { error: true, helperText: t(error.message, { min: PASSWORD_MIN_LENGTH }) }
      : { error: false };
};
