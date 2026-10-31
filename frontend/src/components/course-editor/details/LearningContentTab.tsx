'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Controller, type Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { LazyRichTextEditor } from '@/components/common/rich-text/LazyRichTextEditor';

import { ListFieldEditor } from './ListFieldEditor';

import type { CourseDetailsForm } from '@/schemas/course-editor.schema';
import type { FC } from 'react';

interface LearningContentTabProps {
  control: Control<CourseDetailsForm>;
}

const FORM_MAX_WIDTH = 720;
const LISTS = ['whatYouWillLearn', 'whatYouWillGet', 'requirements'] as const;

/** Rich text description plus the "what you will learn / get" and requirements lists. */
export const LearningContentTab: FC<LearningContentTabProps> = ({ control }) => {
  const { t } = useTranslation();
  return (
    <Stack spacing={4} sx={{ maxWidth: FORM_MAX_WIDTH }}>
      <Box>
        <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600, mb: 1 }}>
          {t('catalog.content.description')}
        </Typography>
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <LazyRichTextEditor
              value={field.value}
              onChange={field.onChange}
              label={t('catalog.content.description')}
              placeholder={t('catalog.content.descriptionPlaceholder')}
            />
          )}
        />
      </Box>
      {LISTS.map((name) => (
        <Controller
          key={name}
          control={control}
          name={name}
          render={({ field }) => (
            <ListFieldEditor
              label={t(`catalog.content.${name}`)}
              values={field.value}
              onChange={field.onChange}
            />
          )}
        />
      ))}
    </Stack>
  );
};
