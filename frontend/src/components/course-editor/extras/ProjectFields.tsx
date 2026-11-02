'use client';

import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import { useFieldError } from '@/hooks/useFieldError';

import type { ProjectForm } from '@/schemas/course-extras.schema';
import type { FC, ReactNode } from 'react';
import type { UseFormReturn } from 'react-hook-form';

interface ProjectFieldsProps {
  form: UseFormReturn<ProjectForm>;
  /** The screenshots field, shown between the description and the links */
  screenshots: ReactNode;
}

const DESCRIPTION_ROWS = 4;

/** The text fields of a project: title, description, (screenshots), live demo link, intro video link. */
export const ProjectFields: FC<ProjectFieldsProps> = ({ form, screenshots }) => {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const { errors } = form.formState;
  return (
    <>
      <TextField
        {...form.register('title')}
        label={t('catalog.extras.projects.title')}
        required
        fullWidth
        autoFocus
        {...fieldError(errors.title)}
      />
      <TextField
        {...form.register('description')}
        label={t('catalog.extras.projects.description')}
        fullWidth
        multiline
        minRows={DESCRIPTION_ROWS}
        {...fieldError(errors.description)}
      />
      {screenshots}
      <TextField
        {...form.register('liveDemoUrl')}
        type="url"
        label={t('catalog.extras.projects.liveDemoUrl')}
        placeholder="https://"
        fullWidth
        {...fieldError(errors.liveDemoUrl)}
      />
      <TextField
        {...form.register('videoUrl')}
        type="url"
        label={t('catalog.extras.projects.videoUrl')}
        placeholder="https://www.youtube.com/watch?v=..."
        fullWidth
        {...(errors.videoUrl
          ? fieldError(errors.videoUrl)
          : { helperText: t('catalog.extras.projects.videoHint') })}
      />
    </>
  );
};
