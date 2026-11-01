'use client';

import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { RichTextField } from '@/components/common/rich-text/RichTextField';
import { useFieldError } from '@/hooks/useFieldError';
import {
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_TITLE_MAX,
  type NotificationForm,
} from '@/schemas/notifications.schema';

import { RoleCheckboxesField } from './RoleCheckboxesField';

import type { FC } from 'react';

interface NotificationFormFieldsProps {
  form: UseFormReturn<NotificationForm>;
}

/** Title, rich text message, priority and target roles (send form and edit dialog). */
export const NotificationFormFields: FC<NotificationFormFieldsProps> = ({ form }) => {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  return (
    <Stack spacing={2}>
      <TextField
        {...form.register('title')}
        label={t('messaging.notifications.form.title')}
        required
        fullWidth
        slotProps={{ htmlInput: { maxLength: NOTIFICATION_TITLE_MAX } }}
        {...fieldError(form.formState.errors.title)}
      />
      <RichTextField
        features="basic"
        control={form.control}
        name="message"
        label={t('messaging.notifications.form.message')}
        placeholder={t('messaging.notifications.form.messagePlaceholder')}
        minHeight={160}
      />
      <Controller
        control={form.control}
        name="priority"
        render={({ field }) => (
          <TextField {...field} select fullWidth label={t('messaging.notifications.form.priority')}>
            {NOTIFICATION_PRIORITIES.map((priority) => (
              <MenuItem key={priority} value={priority}>
                {t(`messaging.notifications.priority.${priority}`)}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      <RoleCheckboxesField control={form.control} />
    </Stack>
  );
};
