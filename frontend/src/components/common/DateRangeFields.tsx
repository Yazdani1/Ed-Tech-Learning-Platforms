'use client';

import TextField from '@mui/material/TextField';

import { INLINE_FIELD_SX } from './InlineSelect';

import type { FC } from 'react';

interface DateRangeFieldsProps {
  /** yyyy-MM-dd ('' = open) */
  from: string;
  to: string;
  fromLabel: string;
  toLabel: string;
  onChange: (changes: { from?: string; to?: string }) => void;
}

/** Two day pickers for a range (both days included): the "to" day cannot be before the "from" day. */
export const DateRangeFields: FC<DateRangeFieldsProps> = ({
  from,
  to,
  fromLabel,
  toLabel,
  onChange,
}) => (
  <>
    <TextField
      type="date"
      size="small"
      label={fromLabel}
      value={from}
      onChange={(event) => {
        onChange({ from: event.target.value });
      }}
      slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: to || undefined } }}
      sx={INLINE_FIELD_SX}
    />
    <TextField
      type="date"
      size="small"
      label={toLabel}
      value={to}
      onChange={(event) => {
        onChange({ to: event.target.value });
      }}
      slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: from || undefined } }}
      sx={INLINE_FIELD_SX}
    />
  </>
);
