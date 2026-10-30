'use client';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { PasswordField } from '@/components/auth/PasswordField';

import type { FieldErrorProps } from './useProfileFieldError';
import type { ProfileFormValues } from '@/schemas/profile.schema';
import type { FC } from 'react';
import type { FieldError, FieldErrors, UseFormRegister } from 'react-hook-form';

interface ProfilePasswordFieldsProps {
  register: UseFormRegister<ProfileFormValues>;
  errors: FieldErrors<ProfileFormValues>;
  fieldError: (error: FieldError | undefined) => FieldErrorProps;
}

/** Current / new / confirm password (left empty: the password stays as it is). */
export const ProfilePasswordFields: FC<ProfilePasswordFieldsProps> = ({
  register,
  errors,
  fieldError,
}) => {
  const { t } = useTranslation();
  return (
    <Box>
      <Typography variant="subtitle2" component="h3" sx={{ fontWeight: 900, mb: 1 }}>
        {t('profile.changePassword')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('profile.changePasswordHint')}
      </Typography>
      <Grid container spacing={2}>
        <Grid size={12}>
          <PasswordField
            {...register('currentPassword')}
            label={t('profile.currentPassword')}
            autoComplete="current-password"
            fullWidth
            {...fieldError(errors.currentPassword)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <PasswordField
            {...register('newPassword')}
            label={t('profile.newPassword')}
            autoComplete="new-password"
            fullWidth
            {...fieldError(errors.newPassword)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <PasswordField
            {...register('confirmPassword')}
            label={t('profile.confirmPassword')}
            autoComplete="new-password"
            fullWidth
            {...fieldError(errors.confirmPassword)}
          />
        </Grid>
      </Grid>
    </Box>
  );
};
