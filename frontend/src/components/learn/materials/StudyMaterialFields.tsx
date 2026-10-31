'use client';

import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import { useFieldError } from '@/hooks/useFieldError';

import { RichTextField } from '@/components/common/rich-text/RichTextField';

import type { StudyMaterialRequest } from '@/schemas/learn.schema';
import type { FC } from 'react';
import type { UseFormReturn } from 'react-hook-form';

interface StudyMaterialFieldsProps {
  form: UseFormReturn<StudyMaterialRequest>;
}

/** Title, rich text description and the optional http(s) resource link. */
export const StudyMaterialFields: FC<StudyMaterialFieldsProps> = ({ form }) => {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  return (
    <>
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
        placeholder={t('learn.materials.placeholder')}
      />
      <TextField
        {...form.register('fileUrl')}
        label={t('learn.materials.link')}
        placeholder="https://..."
        type="url"
        fullWidth
        {...fieldError(form.formState.errors.fileUrl)}
      />
    </>
  );
};
