'use client';

import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import { useFieldError } from '@/hooks/useFieldError';

import type { TeacherForm } from '@/schemas/people.schema';
import type { FC } from 'react';
import type { UseFormReturn } from 'react-hook-form';

interface TeacherTextFieldsProps {
  form: UseFormReturn<TeacherForm>;
}

const BIO_ROWS = 3;
const LINKS_ROWS = 4;

/** Name, bio, expertise and social links fields of the teacher form. */
export const TeacherTextFields: FC<TeacherTextFieldsProps> = ({ form }) => {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const { errors } = form.formState;

  return (
    <>
      <TextField
        {...form.register('name')}
        label={t('people.teachers.name')}
        required
        fullWidth
        {...fieldError(errors.name)}
      />
      <TextField
        {...form.register('bio')}
        label={t('people.teachers.bio')}
        required
        fullWidth
        multiline
        rows={BIO_ROWS}
        {...fieldError(errors.bio)}
      />
      <TextField
        {...form.register('expertise')}
        label={t('people.teachers.expertise')}
        placeholder={t('people.teachers.expertisePlaceholder')}
        fullWidth
      />
      <TextField
        {...form.register('socialLinks')}
        label={t('people.teachers.socialLinks')}
        placeholder={t('people.teachers.socialLinksPlaceholder')}
        fullWidth
        multiline
        rows={LINKS_ROWS}
        {...fieldError(errors.socialLinks)}
      />
    </>
  );
};
