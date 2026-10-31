'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { AppModal } from '@/components/common/AppModal';
import { liveClassRequestSchema, type LiveClassRequest } from '@/schemas/learn.schema';

import { toLiveClassForm, type LiveClassFormTarget } from './live-class.utils';
import { LiveClassClassesField } from './LiveClassClassesField';
import { LiveClassWeekFields } from './LiveClassWeekFields';

import type { FC } from 'react';

interface LiveClassFormModalProps {
  open: boolean;
  target: LiveClassFormTarget | undefined;
  saving: boolean;
  onClose: () => void;
  onSave: (values: LiveClassRequest) => void;
}

/** Add or edit a live class week: title, week name, rich text description and its classes. */
export const LiveClassFormModal: FC<LiveClassFormModalProps> = ({
  open,
  target,
  saving,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation();
  const form = useForm<LiveClassRequest>({
    resolver: zodResolver(liveClassRequestSchema),
    defaultValues: toLiveClassForm(target),
  });
  const { reset } = form;
  const isEdit = target?.week !== undefined;

  useEffect(() => {
    if (open) reset(toLiveClassForm(target));
  }, [open, target, reset]);

  const submit = form.handleSubmit(onSave);

  return (
    <AppModal
      open={open}
      title={t(isEdit ? 'catalog.liveClass.editWeek' : 'catalog.liveClass.newWeek')}
      onClose={onClose}
      onSave={() => void submit()}
      saveLabel={isEdit ? t('common.update') : t('common.add')}
      saving={saving}
      maxWidth="md"
    >
      <LiveClassWeekFields form={form} />
      <LiveClassClassesField form={form} />
    </AppModal>
  );
};
