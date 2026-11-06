'use client';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import { useFieldError } from '@/hooks/useFieldError';

import type { FC } from 'react';
import type { FieldError, UseFormRegisterReturn } from 'react-hook-form';

interface DateRangeFieldsProps {
  start: UseFormRegisterReturn;
  end: UseFormRegisterReturn;
  startError?: FieldError;
  endError?: FieldError;
  /** Promos need both dates; coupons may leave them empty (with a hint) */
  required?: boolean;
}

const DATE_SLOT = { inputLabel: { shrink: true } } as const;

/** Start and end (date and time in the viewer's time zone), side by side from tablet width. */
export const DateRangeFields: FC<DateRangeFieldsProps> = ({
  start,
  end,
  startError,
  endError,
  required = false,
}) => {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const hint = (error: FieldError | undefined, key: string) =>
    error ? fieldError(error) : required ? {} : { helperText: t(key) };
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
      <TextField
        {...start}
        label={t('coupons.startsAt')}
        type="datetime-local"
        required={required}
        fullWidth
        slotProps={DATE_SLOT}
        {...hint(startError, 'coupons.startsAtHelp')}
      />
      <TextField
        {...end}
        label={t('coupons.endsAt')}
        type="datetime-local"
        required={required}
        fullWidth
        slotProps={DATE_SLOT}
        {...hint(endError, 'coupons.endsAtHelp')}
      />
    </Stack>
  );
};
