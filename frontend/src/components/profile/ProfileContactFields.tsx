'use client';

import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import type { FieldErrorProps } from './useProfileFieldError';
import type { ProfileFormValues } from '@/schemas/profile.schema';
import type { FC } from 'react';
import type { FieldError, FieldErrors, UseFormRegister } from 'react-hook-form';

interface ProfileContactFieldsProps {
  register: UseFormRegister<ProfileFormValues>;
  errors: FieldErrors<ProfileFormValues>;
  fieldError: (error: FieldError | undefined) => FieldErrorProps;
  /** Only students may change their email (staff see it read-only) */
  isStudent: boolean;
}

/** Name, email and the optional phone number of the profile form. */
export const ProfileContactFields: FC<ProfileContactFieldsProps> = ({
  register,
  errors,
  fieldError,
  isStudent,
}) => {
  const { t } = useTranslation();
  return (
    <>
      <TextField
        {...register('name')}
        label={t('profile.name')}
        required
        fullWidth
        autoComplete="name"
        {...fieldError(errors.name)}
      />
      <TextField
        {...register('email')}
        label={t('profile.email')}
        type="email"
        required
        fullWidth
        autoComplete="email"
        // Read-only (not disabled): a disabled input would drop the value from the form
        slotProps={{ htmlInput: { readOnly: !isStudent } }}
        helperText={t(isStudent ? 'profile.emailHelpStudent' : 'profile.emailHelpStaff')}
        {...fieldError(errors.email)}
      />
      <TextField
        {...register('phone')}
        label={t('profile.phone')}
        type="tel"
        fullWidth
        autoComplete="tel"
        helperText={t('profile.phoneHelp')}
        {...fieldError(errors.phone)}
      />
    </>
  );
};
