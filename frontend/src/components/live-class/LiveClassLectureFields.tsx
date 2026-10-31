'use client';

import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import { useFieldError } from '@/hooks/useFieldError';

import type { LiveClassRequest } from '@/schemas/learn.schema';
import type { FC } from 'react';
import type { UseFormReturn } from 'react-hook-form';

interface LiveClassLectureFieldsProps {
  form: UseFormReturn<LiveClassRequest>;
  index: number;
  onRemove: () => void;
}

const DESCRIPTION_ROWS = 2;
/** Shared props of the required small inputs */
const SMALL = { fullWidth: true, size: 'small' } as const;
const REQUIRED_SMALL = { ...SMALL, required: true } as const;
const SHRUNK_LABEL = { inputLabel: { shrink: true } };

const CARD_SX = {
  p: 1.5,
  mb: 1.5,
  borderRadius: 0.5,
  display: 'flex',
  flexDirection: 'column',
} as const;
const REMOVE_SX = { minHeight: 44, mt: 1, alignSelf: 'flex-end' } as const;

/** One class of a live class week: title, date, time, description, and "Remove Class". */
export const LiveClassLectureFields: FC<LiveClassLectureFieldsProps> = ({
  form,
  index,
  onRemove,
}) => {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const errors = form.formState.errors.lectures?.[index];

  return (
    <Paper
      variant="outlined"
      role="group"
      sx={CARD_SX}
      aria-label={t('catalog.liveClass.classN', { n: index + 1 })}
    >
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            {...form.register(`lectures.${index}.title`)}
            label={t('catalog.liveClass.classTitle')}
            {...REQUIRED_SMALL}
            {...fieldError(errors?.title)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField
            {...form.register(`lectures.${index}.day`)}
            label={t('catalog.liveClass.classDate')}
            type="date"
            {...REQUIRED_SMALL}
            slotProps={SHRUNK_LABEL}
            {...fieldError(errors?.day)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField
            {...form.register(`lectures.${index}.time`)}
            label={t('catalog.liveClass.classTime')}
            type="time"
            {...REQUIRED_SMALL}
            slotProps={SHRUNK_LABEL}
            {...fieldError(errors?.time)}
          />
        </Grid>
        <Grid size={12}>
          <TextField
            {...form.register(`lectures.${index}.description`)}
            label={t('catalog.liveClass.classDescription')}
            {...SMALL}
            multiline
            minRows={DESCRIPTION_ROWS}
          />
        </Grid>
      </Grid>
      <Button color="error" onClick={onRemove} sx={REMOVE_SX}>
        {t('catalog.liveClass.removeClass')}
      </Button>
    </Paper>
  );
};
