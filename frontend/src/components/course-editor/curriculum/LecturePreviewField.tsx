'use client';

import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { Controller, type Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { LectureForm } from '@/schemas/course-editor.schema';
import type { FC } from 'react';

interface LecturePreviewFieldProps {
  control: Control<LectureForm>;
}

/** "Free Preview" switch of a lecture (anyone can watch it without enrolling). */
export const LecturePreviewField: FC<LecturePreviewFieldProps> = ({ control }) => {
  const { t } = useTranslation();
  return (
    <Controller
      control={control}
      name="isPreview"
      render={({ field }) => (
        <FormControlLabel
          sx={{ minHeight: 44 }}
          control={
            <Switch
              color="info"
              checked={field.value}
              onChange={(event) => {
                field.onChange(event.target.checked);
              }}
            />
          }
          label={t('catalog.curriculum.previewHelp')}
        />
      )}
    />
  );
};
