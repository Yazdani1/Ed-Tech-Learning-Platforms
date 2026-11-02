'use client';

import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import { useFieldError } from '@/hooks/useFieldError';

import type { SuccessStoryForm } from '@/schemas/course-extras.schema';
import type { FC } from 'react';
import type { UseFormReturn } from 'react-hook-form';

interface SuccessStoryFieldsProps {
  form: UseFormReturn<SuccessStoryForm>;
}

const DESCRIPTION_ROWS = 4;

/** The text fields of a success story: title, description, company name. */
export const SuccessStoryFields: FC<SuccessStoryFieldsProps> = ({ form }) => {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const { errors } = form.formState;
  return (
    <>
      <TextField
        {...form.register('title')}
        label={t('catalog.extras.stories.title')}
        placeholder={t('catalog.extras.stories.titlePlaceholder')}
        required
        fullWidth
        {...fieldError(errors.title)}
      />
      <TextField
        {...form.register('description')}
        label={t('catalog.extras.stories.description')}
        fullWidth
        multiline
        minRows={DESCRIPTION_ROWS}
        {...fieldError(errors.description)}
      />
      <TextField
        {...form.register('companyName')}
        label={t('catalog.extras.stories.companyName')}
        fullWidth
        {...fieldError(errors.companyName)}
      />
    </>
  );
};
