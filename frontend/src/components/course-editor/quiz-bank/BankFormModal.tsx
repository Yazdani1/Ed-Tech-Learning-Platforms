'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { AppModal } from '@/components/common/AppModal';
import { useFieldError } from '@/hooks/useFieldError';
import { bankFormSchema, type BankForm } from '@/schemas/course-editor.schema';

import type { FC } from 'react';
import { type QuizBank } from '@/schemas/quiz.schema';

interface BankFormModalProps {
  open: boolean;
  /** The bank being edited; undefined to create one */
  bank: QuizBank | undefined;
  saving: boolean;
  onClose: () => void;
  onSave: (values: BankForm) => void;
}

const DESCRIPTION_ROWS = 2;

/** Create or edit a quiz bank: title and optional description. */
export const BankFormModal: FC<BankFormModalProps> = ({ open, bank, saving, onClose, onSave }) => {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const form = useForm<BankForm>({
    resolver: zodResolver(bankFormSchema),
    defaultValues: { title: '', description: '' },
  });
  const { reset } = form;

  useEffect(() => {
    if (open) reset({ title: bank?.title ?? '', description: bank?.description ?? '' });
  }, [open, bank, reset]);

  const submit = form.handleSubmit(onSave);

  return (
    <AppModal
      open={open}
      title={t(bank ? 'catalog.quiz.editBank' : 'catalog.quiz.addBank')}
      onClose={onClose}
      onSave={() => void submit()}
      saveLabel={bank ? t('common.save') : t('common.create')}
      saving={saving}
      maxWidth="xs"
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        <TextField
          {...form.register('title')}
          label={t('catalog.quiz.bankTitle')}
          required
          fullWidth
          autoFocus
          {...fieldError(form.formState.errors.title)}
        />
        <TextField
          {...form.register('description')}
          label={t('catalog.quiz.bankDescription')}
          helperText={t('common.optional')}
          fullWidth
          multiline
          minRows={DESCRIPTION_ROWS}
        />
      </Stack>
    </AppModal>
  );
};
