'use client';

import AutorenewIcon from '@mui/icons-material/Autorenew';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useBatchNumberSuggestion, useSuggestBatchNumber } from '@/api/coupons.api';
import { useFieldError } from '@/hooks/useFieldError';
import { toastError } from '@/utils/toast-error';

import type { CourseDetailsForm } from '@/schemas/course-editor.schema';
import type { FC } from 'react';
import type { UseFormReturn } from 'react-hook-form';

interface BatchNumberFieldProps {
  form: UseFormReturn<CourseDetailsForm>;
  isNew: boolean;
}

const BATCH_DIGITS = 4;

/** The course's 4-digit batch number: a new course starts with a free random one; any free 4 digits can be typed. */
export const BatchNumberField: FC<BatchNumberFieldProps> = ({ form, isNew }) => {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const suggestion = useBatchNumberSuggestion(isNew);
  const { register, setValue, getValues, formState } = form;

  useEffect(() => {
    if (suggestion.data && !getValues('batchNumber')) setValue('batchNumber', suggestion.data);
  }, [suggestion.data, getValues, setValue]);

  const anotherNumber = useSuggestBatchNumber();
  const another = (): void => {
    anotherNumber
      .mutateAsync()
      .then((value) => {
        setValue('batchNumber', value, { shouldDirty: true, shouldValidate: true });
      })
      .catch(toastError);
  };

  return (
    <TextField
      {...register('batchNumber')}
      label={t('catalog.basic.batchNumber')}
      fullWidth
      slotProps={{
        htmlInput: { inputMode: 'numeric', maxLength: BATCH_DIGITS },
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title={t('catalog.basic.batchSuggest')}>
                <IconButton
                  aria-label={t('catalog.basic.batchSuggest')}
                  onClick={another}
                  edge="end"
                  sx={{ width: 44, height: 44 }}
                >
                  <AutorenewIcon />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
        },
      }}
      {...(formState.errors.batchNumber
        ? fieldError(formState.errors.batchNumber)
        : { helperText: t('catalog.basic.batchHelp') })}
    />
  );
};
