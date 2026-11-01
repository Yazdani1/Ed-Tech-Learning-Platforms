'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import EventNoteIcon from '@mui/icons-material/EventNote';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useCreateReminder } from '@/api/schedule.api';
import { useToastResult } from '@/hooks/useToastResult';
import {
  makeReminderFormSchema,
  type ReminderForm as ReminderFormValues,
} from '@/schemas/schedule.schema';
import { fromLocalInput } from '@/utils/dateTime';

import { requestNotificationPermission } from './alarm';
import { FormCardTitle } from './FormCardTitle';
import { FormSubmitButton } from './FormSubmitButton';
import { ReminderFields } from './ReminderFields';

const EMPTY: ReminderFormValues = {
  title: '',
  description: '',
  startDateTime: '',
  endDateTime: '',
};

/** "New Reminder" card. The start must be in the future; the end (optional) after the start. */
export const ReminderForm = () => {
  const { t } = useTranslation();
  const createReminder = useCreateReminder();
  const toastResult = useToastResult();
  const schema = useMemo(() => makeReminderFormSchema(true), []);
  const form = useForm<ReminderFormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  const submit = form.handleSubmit(async (values) => {
    // Asked from the click, so the browser allows the prompt; the in-page alert works without it
    requestNotificationPermission();
    const created = await toastResult(
      createReminder.mutateAsync({
        title: values.title,
        description: values.description,
        startDateTime: fromLocalInput(values.startDateTime) ?? values.startDateTime,
        endDateTime: fromLocalInput(values.endDateTime) ?? undefined,
      }),
      t('schedule.reminder.created'),
    );
    if (created) form.reset(EMPTY);
  });

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <FormCardTitle icon={<EventNoteIcon color="primary" aria-hidden />}>
          {t('schedule.reminder.newTitle')}
        </FormCardTitle>
        <Box component="form" noValidate onSubmit={(event) => void submit(event)}>
          <ReminderFields form={form} withPlaceholders />
          <FormSubmitButton
            pending={createReminder.isPending}
            label={t('schedule.reminder.submit')}
            pendingLabel={t('schedule.reminder.saving')}
          />
        </Box>
      </CardContent>
    </Card>
  );
};
