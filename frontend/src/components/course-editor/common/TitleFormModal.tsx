'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import TextField from '@mui/material/TextField';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { AppModal } from '@/components/common/AppModal';
import { useFieldError } from '@/hooks/useFieldError';
import { titleFormSchema, type TitleForm } from '@/schemas/course-editor.schema';

import type { FC } from 'react';

interface TitleFormModalProps {
  open: boolean;
  title: string;
  fieldLabel: string;
  initialValue?: string;
  saving: boolean;
  saveLabel: string;
  onClose: () => void;
  /** The trimmed title */
  onSave: (title: string) => void;
}

/** A dialog with one required title field (add / rename a section). */
export const TitleFormModal: FC<TitleFormModalProps> = ({
  open,
  title,
  fieldLabel,
  initialValue = '',
  saving,
  saveLabel,
  onClose,
  onSave,
}) => {
  const fieldError = useFieldError();
  const { t } = useTranslation();
  const form = useForm<TitleForm>({
    resolver: zodResolver(titleFormSchema),
    defaultValues: { title: initialValue },
  });
  const { reset } = form;

  useEffect(() => {
    if (open) reset({ title: initialValue });
  }, [open, initialValue, reset]);

  const submit = form.handleSubmit((values) => {
    onSave(values.title);
  });

  return (
    <AppModal
      open={open}
      title={title}
      onClose={onClose}
      onSave={() => void submit()}
      saveLabel={saveLabel}
      cancelLabel={t('common.cancel')}
      saving={saving}
      maxWidth="xs"
    >
      <TextField
        {...form.register('title')}
        label={fieldLabel}
        required
        fullWidth
        autoFocus
        sx={{ mt: 1 }}
        {...fieldError(form.formState.errors.title)}
      />
    </AppModal>
  );
};
