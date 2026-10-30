'use client';

import { useTranslation } from 'react-i18next';

import { PASSWORD_MIN_LENGTH } from '@/schemas/auth.schema';
import { PASSWORD_MAX_LENGTH } from '@/schemas/profile.schema';

import type { FieldError } from 'react-hook-form';

export interface FieldErrorProps {
  error?: boolean;
  helperText?: string;
}

/** A form error (an i18n key from the Zod schema) as TextField props; nothing when there is no error. */
export const useProfileFieldError = (): ((error: FieldError | undefined) => FieldErrorProps) => {
  const { t } = useTranslation();
  return (error) =>
    error?.message
      ? {
          error: true,
          helperText: t(error.message, { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH }),
        }
      : {};
};
