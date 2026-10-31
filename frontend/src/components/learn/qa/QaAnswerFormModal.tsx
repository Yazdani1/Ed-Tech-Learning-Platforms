'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useSaveAnswer } from '@/api/learn-qa.api';
import { AppModal } from '@/components/common/AppModal';
import { answerRequestSchema, type AnswerRequest, type QaAnswer } from '@/schemas/learn.schema';

import { RichTextField } from '@/components/common/rich-text/RichTextField';

import type { FC } from 'react';

interface QaAnswerFormModalProps {
  courseId: string;
  questionId: string;
  open: boolean;
  /** The answer being edited; undefined to post a new one */
  item: QaAnswer | undefined;
  onClose: () => void;
}

/** Post or edit an answer (rich text). */
export const QaAnswerFormModal: FC<QaAnswerFormModalProps> = ({
  courseId,
  questionId,
  open,
  item,
  onClose,
}) => {
  const { t } = useTranslation();
  const save = useSaveAnswer(courseId, questionId);
  const form = useForm<AnswerRequest>({
    resolver: zodResolver(answerRequestSchema),
    defaultValues: { body: '' },
  });
  const { reset } = form;
  const { reset: resetMutation } = save;

  useEffect(() => {
    if (!open) return;
    reset({ body: item?.body ?? '' });
    resetMutation();
  }, [open, item, reset, resetMutation]);

  const onSave = form.handleSubmit(async (body) => {
    await save.mutateAsync({ id: item?._id, body }).then(
      () => {
        toast.success(t(item ? 'learn.qa.answerUpdated' : 'learn.qa.answerPosted'));
        onClose();
      },
      () => undefined,
    );
  });

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={t(item ? 'learn.qa.editAnswer' : 'learn.qa.yourAnswer')}
      onSave={() => void onSave()}
      saveLabel={item ? t('common.update') : t('learn.qa.postAnswer')}
      saving={save.isPending}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        {save.error && <Alert severity="error">{save.error.message}</Alert>}
        <RichTextField
          features="basic"
          control={form.control}
          name="body"
          label={t('learn.qa.answer')}
          placeholder={t('learn.qa.answerPlaceholder')}
        />
      </Stack>
    </AppModal>
  );
};
