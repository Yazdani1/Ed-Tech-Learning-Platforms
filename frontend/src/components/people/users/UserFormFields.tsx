'use client';

import TextField from '@mui/material/TextField';
import { Controller, type FieldError, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import {
  MANAGED_PASSWORD_MAX,
  MANAGED_PASSWORD_MIN,
  type UserEditForm,
} from '@/schemas/people.schema';

import { RoleSelect } from './RoleSelect';

import type { FC } from 'react';

interface UserFormFieldsProps {
  form: UseFormReturn<UserEditForm>;
  /** Editing: the password is optional (blank keeps the current one) */
  isEdit: boolean;
}

/** Name, email, password and role fields of the user form. */
export const UserFormFields: FC<UserFormFieldsProps> = ({ form, isEdit }) => {
  const { t } = useTranslation();
  const { errors } = form.formState;
  const errorProps = (error: FieldError | undefined) =>
    error?.message
      ? {
          error: true,
          helperText: t(error.message, { min: MANAGED_PASSWORD_MIN, max: MANAGED_PASSWORD_MAX }),
        }
      : {};

  return (
    <>
      <TextField
        {...form.register('name')}
        label={t('people.users.name')}
        required
        fullWidth
        {...errorProps(errors.name)}
      />
      <TextField
        {...form.register('email')}
        label={t('people.users.email')}
        type="email"
        required
        fullWidth
        {...errorProps(errors.email)}
      />
      <TextField
        {...form.register('password')}
        label={t('people.users.password')}
        type="password"
        autoComplete="new-password"
        required={!isEdit}
        fullWidth
        helperText={isEdit ? t('people.users.passwordKeep') : undefined}
        {...errorProps(errors.password)}
      />
      <Controller
        control={form.control}
        name="role"
        render={({ field }) => <RoleSelect value={field.value} onChange={field.onChange} />}
      />
    </>
  );
};
