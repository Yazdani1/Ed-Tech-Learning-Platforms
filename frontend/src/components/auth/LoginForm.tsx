'use client';

import School from '@mui/icons-material/School';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { useTranslation } from 'react-i18next';

import { useLogin } from '@/api/auth.api';
import { useAuthForm } from '@/hooks/useAuthForm';
import { useFieldError } from '@/hooks/useFieldError';
import { loginRequestSchema } from '@/schemas/auth.schema';

import { AuthFormHeader } from './AuthFormHeader';
import { AuthSwitchLink } from './AuthSwitchLink';
import { EmailField } from './EmailField';
import { PasswordField } from './PasswordField';

/** Sign-in form. On success GuestGate sees the signed-in user and opens their page. */
export const LoginForm = () => {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const form = useAuthForm({
    schema: loginRequestSchema,
    defaultValues: { email: '', password: '' },
    mutation: useLogin(),
    successKey: 'auth.loginSuccess',
  });

  return (
    <Stack
      component="form"
      noValidate
      spacing={2}
      aria-label={t('auth.loginFormLabel')}
      onSubmit={form.onSubmit}
    >
      <AuthFormHeader
        icon={<School />}
        title={t('auth.loginHeading')}
        subtitle={t('auth.loginSubtitle')}
      />
      {form.serverError && <Alert severity="error">{form.serverError}</Alert>}
      <EmailField
        {...form.register('email')}
        label={t('auth.email')}
        fullWidth
        {...fieldError(form.errors.email)}
      />
      <PasswordField
        {...form.register('password')}
        label={t('auth.password')}
        autoComplete="current-password"
        fullWidth
        {...fieldError(form.errors.password)}
      />
      <Button type="submit" variant="contained" size="large" fullWidth loading={form.isPending}>
        {t('auth.loginSubmit')}
      </Button>
      <AuthSwitchLink
        question={t('auth.noAccount')}
        linkText={t('auth.createAccountLink')}
        href="/auth/register"
      />
    </Stack>
  );
};
