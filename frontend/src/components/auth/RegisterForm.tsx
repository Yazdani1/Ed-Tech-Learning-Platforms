'use client';

import AutoStories from '@mui/icons-material/AutoStories';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { useTranslation } from 'react-i18next';

import { useRegister } from '@/api/auth.api';
import { useAuthForm } from '@/hooks/useAuthForm';
import { useFieldError } from '@/hooks/useFieldError';
import { registerRequestSchema } from '@/schemas/auth.schema';

import { AuthFormHeader } from './AuthFormHeader';
import { AuthSwitchLink } from './AuthSwitchLink';
import { EmailField } from './EmailField';
import { NameField } from './NameField';
import { PasswordField } from './PasswordField';

/** Student sign-up form. On success GuestGate sees the new user and opens the student dashboard. */
export const RegisterForm = () => {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const form = useAuthForm({
    schema: registerRequestSchema,
    defaultValues: { name: '', email: '', password: '' },
    mutation: useRegister(),
    successKey: 'auth.registerSuccess',
  });

  return (
    <Stack
      component="form"
      noValidate
      spacing={2}
      aria-label={t('auth.registerFormLabel')}
      onSubmit={form.onSubmit}
    >
      <AuthFormHeader
        icon={<AutoStories />}
        title={t('auth.registerHeading')}
        subtitle={t('auth.registerSubtitle')}
      />
      {form.serverError && <Alert severity="error">{form.serverError}</Alert>}
      <NameField
        {...form.register('name')}
        label={t('auth.name')}
        fullWidth
        {...fieldError(form.errors.name)}
      />
      <EmailField
        {...form.register('email')}
        label={t('auth.email')}
        fullWidth
        {...fieldError(form.errors.email)}
      />
      <PasswordField
        {...form.register('password')}
        label={t('auth.password')}
        autoComplete="new-password"
        fullWidth
        {...fieldError(form.errors.password)}
      />
      <Button type="submit" variant="contained" size="large" fullWidth loading={form.isPending}>
        {t('auth.registerSubmit')}
      </Button>
      <AuthSwitchLink
        question={t('auth.hasAccount')}
        linkText={t('auth.signInLink')}
        href="/auth/login"
      />
    </Stack>
  );
};
