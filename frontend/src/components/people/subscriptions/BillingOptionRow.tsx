'use client';

import CancelIcon from '@mui/icons-material/Cancel';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import { useFieldError } from '@/hooks/useFieldError';

import type { PlanForm } from '@/schemas/people.schema';
import type { FC } from 'react';
import type { UseFormReturn } from 'react-hook-form';

interface BillingOptionRowProps {
  form: UseFormReturn<PlanForm>;
  index: number;
  canRemove: boolean;
  onRemove: () => void;
}

/** One billing option of the plan form: label, months, price and a remove button. */
export const BillingOptionRow: FC<BillingOptionRowProps> = ({
  form,
  index,
  canRemove,
  onRemove,
}) => {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const errors = form.formState.errors.billingOptions?.[index];

  return (
    <Box
      role="group"
      aria-label={t('people.plans.optionLabel', { number: index + 1 })}
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1.2fr 0.8fr 1fr auto' },
        gap: 1,
        mb: 1.5,
      }}
    >
      <TextField
        {...form.register(`billingOptions.${index}.label`)}
        label={t('people.plans.label')}
        placeholder={t('people.plans.labelPlaceholder')}
        size="small"
        {...fieldError(errors?.label)}
      />
      <TextField
        {...form.register(`billingOptions.${index}.duration`)}
        label={t('people.plans.monthsField')}
        type="number"
        size="small"
        slotProps={{ htmlInput: { min: 1 } }}
        {...fieldError(errors?.duration)}
      />
      <TextField
        {...form.register(`billingOptions.${index}.price`)}
        label={t('people.plans.price')}
        type="number"
        size="small"
        slotProps={{ htmlInput: { min: 0 } }}
        {...fieldError(errors?.price)}
      />
      <IconButton
        color="error"
        aria-label={t('people.plans.removeOption', { number: index + 1 })}
        onClick={onRemove}
        disabled={!canRemove}
        sx={{ width: 44, height: 44, justifySelf: 'end' }}
      >
        <CancelIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};
