'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { AppModal } from '@/components/common/AppModal';
import { useFieldError } from '@/hooks/useFieldError';
import { faqFormSchema, type CourseFaq, type FaqForm } from '@/schemas/course-extras.schema';

import type { FC } from 'react';

interface FaqFormModalProps {
  open: boolean;
  /** The question being edited; undefined to add one */
  faq: CourseFaq | undefined;
  saving: boolean;
  onClose: () => void;
  onSave: (faq: CourseFaq) => void;
}

const ANSWER_ROWS = 5;
const EMPTY: FaqForm = { question: '', answer: '' };

/** Add or edit one question and its answer. */
export const FaqFormModal: FC<FaqFormModalProps> = ({ open, faq, saving, onClose, onSave }) => {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const form = useForm<FaqForm>({ resolver: zodResolver(faqFormSchema), defaultValues: EMPTY });
  const { reset } = form;
  const { errors } = form.formState;

  useEffect(() => {
    if (open) reset(faq ?? EMPTY);
  }, [open, faq, reset]);

  const submit = form.handleSubmit(onSave);

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={t(faq ? 'catalog.extras.faq.edit' : 'catalog.extras.faq.add')}
      onSave={() => void submit()}
      saveLabel={t('common.save')}
      saving={saving}
    >
      <Stack spacing={2.5} sx={{ pt: 1 }}>
        <TextField
          {...form.register('question')}
          label={t('catalog.extras.faq.question')}
          required
          fullWidth
          autoFocus
          {...fieldError(errors.question)}
        />
        <TextField
          {...form.register('answer')}
          label={t('catalog.extras.faq.answer')}
          required
          fullWidth
          multiline
          minRows={ANSWER_ROWS}
          {...fieldError(errors.answer)}
        />
      </Stack>
    </AppModal>
  );
};
