'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useSaveQuestion } from '@/api/learn-qa.api';
import { AppModal } from '@/components/common/AppModal';
import { useFieldError } from '@/hooks/useFieldError';
import {
  titledPostRequestSchema,
  type QaQuestion,
  type TitledPostRequest,
} from '@/schemas/learn.schema';

import { RichTextField } from '@/components/common/rich-text/RichTextField';

import type { FC } from 'react';

interface QaQuestionFormModalProps {
  courseId: string;
  open: boolean;
  /** The question being edited; undefined to ask a new one */
  item: QaQuestion | undefined;
  onClose: () => void;
}

/** Ask or edit a question (title + rich text description). */
export const QaQuestionFormModal: FC<QaQuestionFormModalProps> = ({
  courseId,
  open,
  item,
  onClose,
}) => {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const save = useSaveQuestion(courseId);
  const form = useForm<TitledPostRequest>({
    resolver: zodResolver(titledPostRequestSchema),
    defaultValues: { title: '', description: '' },
  });
  const { reset } = form;
  const { reset: resetMutation } = save;

  useEffect(() => {
    if (!open) return;
    reset({ title: item?.title ?? '', description: item?.description ?? '' });
    resetMutation();
  }, [open, item, reset, resetMutation]);

  const onSave = form.handleSubmit(async (body) => {
    await save.mutateAsync({ id: item?._id, body }).then(
      () => {
        toast.success(t(item ? 'learn.qa.questionUpdated' : 'learn.qa.questionPosted'));
        onClose();
      },
      () => undefined,
    );
  });

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={t(item ? 'learn.qa.editQuestion' : 'learn.qa.newQuestion')}
      onSave={() => void onSave()}
      saveLabel={item ? t('common.update') : t('learn.qa.postQuestion')}
      saving={save.isPending}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        {save.error && <Alert severity="error">{save.error.message}</Alert>}
        <TextField
          {...form.register('title')}
          label={t('learn.fields.title')}
          required
          fullWidth
          autoFocus
          {...fieldError(form.formState.errors.title)}
        />
        <RichTextField
          features="basic"
          control={form.control}
          name="description"
          label={t('learn.fields.description')}
          placeholder={t('learn.qa.questionPlaceholder')}
        />
      </Stack>
    </AppModal>
  );
};
