'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Stack from '@mui/material/Stack';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { AppModal } from '@/components/common/AppModal';
import { useOnOpen } from '@/hooks/useOnOpen';
import {
  successStoryFormSchema,
  type CourseImage,
  type SuccessStory,
  type SuccessStoryForm,
} from '@/schemas/course-extras.schema';

import { SuccessStoryFields } from './SuccessStoryFields';
import { UploadedImageField } from './UploadedImageField';

import type { FC } from 'react';

interface SuccessStoryFormModalProps {
  courseId: string;
  open: boolean;
  /** The story being edited; undefined to add one */
  story: SuccessStory | undefined;
  saving: boolean;
  onClose: () => void;
  onSave: (story: SuccessStory) => void;
}

const EMPTY: SuccessStoryForm = { title: '', description: '', companyName: '' };

const storyValues = (story: SuccessStory | undefined): SuccessStoryForm =>
  story
    ? { title: story.title, description: story.description, companyName: story.companyName }
    : EMPTY;

/** A success story: profile picture, title, description, company name and company logo. */
export const SuccessStoryFormModal: FC<SuccessStoryFormModalProps> = ({
  courseId,
  open,
  story,
  saving,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation();
  const [photo, setPhoto] = useState<CourseImage | null>(null);
  const [companyLogo, setCompanyLogo] = useState<CourseImage | null>(null);
  const form = useForm<SuccessStoryForm>({
    resolver: zodResolver(successStoryFormSchema),
    defaultValues: EMPTY,
  });
  const { reset } = form;
  useOnOpen(open, () => {
    setPhoto(story?.photo ?? null);
    setCompanyLogo(story?.companyLogo ?? null);
  });
  useEffect(() => {
    if (open) reset(storyValues(story));
  }, [open, story, reset]);

  const submit = form.handleSubmit((values) => {
    onSave({ ...values, photo, companyLogo });
  });

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={t(story ? 'catalog.extras.stories.edit' : 'catalog.extras.stories.add')}
      onSave={() => void submit()}
      saveLabel={t('common.save')}
      saving={saving}
    >
      <Stack spacing={2.5} sx={{ pt: 1 }}>
        <UploadedImageField
          courseId={courseId}
          label={t('catalog.extras.stories.photo')}
          image={photo}
          onChange={setPhoto}
          round
        />
        <SuccessStoryFields form={form} />
        <UploadedImageField
          courseId={courseId}
          label={t('catalog.extras.stories.companyLogo')}
          image={companyLogo}
          onChange={setCompanyLogo}
        />
      </Stack>
    </AppModal>
  );
};
