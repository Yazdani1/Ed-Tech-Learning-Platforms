'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useUpdateSchedule } from '@/api/schedule.api';
import { AppModal } from '@/components/common/AppModal';
import { useToastResult } from '@/hooks/useToastResult';
import {
  makeReminderFormSchema,
  type ReminderForm,
  type Schedule,
  type UpdateScheduleBody,
} from '@/schemas/schedule.schema';
import { fromLocalInput, toDateTimeInput } from '@/utils/dateTime';

import { ReminderFields } from './ReminderFields';

import type { FC } from 'react';

interface ReminderEditModalProps {
  open: boolean;
  reminder: Schedule | undefined;
  onClose: () => void;
}

const toFormValues = (reminder: Schedule | undefined): ReminderForm => ({
  title: reminder?.title ?? '',
  description: reminder?.description ?? '',
  startDateTime: toDateTimeInput(reminder?.startDateTime),
  endDateTime: toDateTimeInput(reminder?.endDateTime),
});

const toBody = (values: ReminderForm): UpdateScheduleBody => {
  const start = fromLocalInput(values.startDateTime) ?? values.startDateTime;
  const body: UpdateScheduleBody = {
    title: values.title,
    description: values.description,
    startDateTime: start,
    endDateTime: fromLocalInput(values.endDateTime),
  };
  // Moved to a later time: it waits again and its alarm goes off at the new start
  if (Date.parse(start) > Date.now()) body.status = 'pending';
  return body;
};

/** "Edit Reminder" dialog (title, description, start, end; clearing the end removes it). */
export const ReminderEditModal: FC<ReminderEditModalProps> = ({ open, reminder, onClose }) => {
  const { t } = useTranslation();
  const update = useUpdateSchedule();
  const toastResult = useToastResult();
  const schema = useMemo(() => makeReminderFormSchema(false), []);
  const form = useForm<ReminderForm>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(reminder),
  });
  const { reset } = form;

  useEffect(() => {
    if (open) reset(toFormValues(reminder));
  }, [open, reminder, reset]);

  const submit = form.handleSubmit(async (values) => {
    if (!reminder) return;
    const saved = await toastResult(
      update.mutateAsync({ id: reminder._id, body: toBody(values) }),
      t('schedule.reminder.saved'),
    );
    if (saved) onClose();
  });

  return (
    <AppModal
      open={open}
      title={t('schedule.reminder.editTitle')}
      onClose={onClose}
      onSave={() => void submit()}
      saveLabel={t('schedule.reminder.saveChanges')}
      cancelLabel={t('common.cancel')}
      saving={update.isPending}
    >
      <ReminderFields form={form} />
    </AppModal>
  );
};
