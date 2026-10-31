'use client';

import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

import type { FC } from 'react';

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  label: string;
  value: string;
  options: readonly FilterOption[];
  onChange: (value: string) => void;
  /** Text of the "no filter" entry (value ''); left out when the options already have one */
  allLabel?: string;
}

const TOUCH_SX = { minHeight: 44 } as const;

/** The single-choice dropdown of every filter panel and toolbar (44 px rows, empty value = "no filter"). */
export const FilterSelect: FC<FilterSelectProps> = ({
  label,
  value,
  options,
  onChange,
  allLabel,
}) => (
  <TextField
    select
    size="small"
    fullWidth
    label={label}
    // An id no longer in the list (deleted category) shows as "no filter" instead of an empty box
    value={options.some((option) => option.value === value) ? value : ''}
    onChange={(event) => {
      onChange(event.target.value);
    }}
    sx={{ '& .MuiInputBase-root': TOUCH_SX }}
  >
    {allLabel !== undefined && (
      <MenuItem value="" sx={TOUCH_SX}>
        {allLabel}
      </MenuItem>
    )}
    {options.map((option) => (
      <MenuItem key={option.value || 'all'} value={option.value} sx={TOUCH_SX}>
        {option.label}
      </MenuItem>
    ))}
  </TextField>
);
