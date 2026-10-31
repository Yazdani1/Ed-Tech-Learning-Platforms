'use client';

import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import { alpha, type Theme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useFieldError } from '@/hooks/useFieldError';
import { OPTION_LABELS, type QuestionForm } from '@/schemas/course-editor.schema';

import type { FC } from 'react';

interface QuestionOptionFieldsProps {
  form: UseFormReturn<QuestionForm>;
  index: number;
}

const CORRECT_TINT = 0.06;

const optionSx = (isCorrect: boolean) => ({
  p: 1.5,
  borderRadius: 1,
  border: 1,
  borderColor: isCorrect ? 'success.main' : 'divider',
  bgcolor: (theme: Theme) =>
    isCorrect ? alpha(theme.palette.success.main, CORRECT_TINT) : 'transparent',
});

/** One answer option: "correct" checkbox, option text and optional explanation. */
export const QuestionOptionFields: FC<QuestionOptionFieldsProps> = ({ form, index }) => {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const letter = OPTION_LABELS[index] ?? String(index + 1);
  const errors = form.formState.errors.options?.[index];

  return (
    <Controller
      control={form.control}
      name="correctOptionIndices"
      render={({ field }) => {
        const isCorrect = field.value.includes(index);
        return (
          <Box
            role="group"
            aria-label={t('catalog.quiz.optionN', { letter })}
            sx={optionSx(isCorrect)}
          >
            <FormControlLabel
              sx={{ minHeight: 44 }}
              control={
                <Checkbox
                  color="success"
                  checked={isCorrect}
                  onChange={(event) => {
                    const others = field.value.filter((value) => value !== index);
                    field.onChange(event.target.checked ? [...others, index] : others);
                  }}
                />
              }
              label={t('catalog.quiz.markCorrect', { letter })}
            />
            <Stack spacing={1}>
              <TextField
                {...form.register(`options.${index}.text`)}
                label={t('catalog.quiz.optionText', { letter })}
                required
                fullWidth
                size="small"
                {...fieldError(errors?.text)}
              />
              <TextField
                {...form.register(`options.${index}.explanation`)}
                label={t('catalog.quiz.optionExplanation', { letter })}
                helperText={t('common.optional')}
                fullWidth
                size="small"
              />
            </Stack>
          </Box>
        );
      }}
    />
  );
};
