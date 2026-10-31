'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { AppModal } from '@/components/common/AppModal';
import { useFieldError } from '@/hooks/useFieldError';
import { lectureFormSchema, type LectureForm } from '@/schemas/course-editor.schema';

import { LecturePreviewField } from './LecturePreviewField';

import type { FC } from 'react';
import { type CourseLecture } from '@/schemas/browse.schema';

interface LectureFormModalProps {
  open: boolean;
  /** The lecture being edited; undefined to add one */
  lecture: CourseLecture | undefined;
  saving: boolean;
  onClose: () => void;
  onSave: (values: LectureForm) => void;
}

const toForm = (lecture: CourseLecture | undefined): LectureForm => ({
  title: lecture?.title ?? '',
  videoUrl: lecture?.videoUrl ?? '',
  isPreview: lecture?.isPreview ?? false,
});

/** Add or edit a lecture: title, YouTube address and the free preview switch. */
export const LectureFormModal: FC<LectureFormModalProps> = ({
  open,
  lecture,
  saving,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const form = useForm<LectureForm>({
    resolver: zodResolver(lectureFormSchema),
    defaultValues: toForm(lecture),
  });
  const { reset, register, control, formState } = form;

  useEffect(() => {
    if (open) reset(toForm(lecture));
  }, [open, lecture, reset]);

  const submit = form.handleSubmit(onSave);

  return (
    <AppModal
      open={open}
      title={t(lecture ? 'catalog.curriculum.editLecture' : 'catalog.curriculum.addLecture')}
      onClose={onClose}
      onSave={() => void submit()}
      saveLabel={lecture ? t('common.update') : t('catalog.curriculum.addLecture')}
      saving={saving}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        <TextField
          {...register('title')}
          label={t('catalog.curriculum.lectureTitle')}
          required
          fullWidth
          autoFocus
          {...fieldError(formState.errors.title)}
        />
        <TextField
          {...register('videoUrl')}
          label={t('catalog.curriculum.videoUrl')}
          placeholder={t('catalog.curriculum.videoUrlPlaceholder')}
          fullWidth
          {...(formState.errors.videoUrl
            ? fieldError(formState.errors.videoUrl)
            : { helperText: t('common.optional') })}
        />
        <LecturePreviewField control={control} />
      </Stack>
    </AppModal>
  );
};
