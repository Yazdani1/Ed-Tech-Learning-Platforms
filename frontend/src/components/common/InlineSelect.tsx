'use client';

import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

import type { SxProps, Theme } from '@mui/material/styles';
import type { FC } from 'react';

export interface InlineOption {
  value: string;
  label: string;
}

interface InlineSelectProps {
  label: string;
  value: string;
  options: readonly InlineOption[];
  onChange: (value: string) => void;
  sx?: SxProps<Theme>;
}

/** Half the row on phones, a fixed width from tablets: the toolbar width for filters. */
export const INLINE_FIELD_SX = {
  minWidth: { xs: 'calc(50% - 4px)', sm: 150 },
  flex: { xs: 1, sm: 'none' },
} as const;

/** A small single-choice dropdown for toolbars (sits in a row with other filters, never full width on desktop). */
export const InlineSelect: FC<InlineSelectProps> = ({
  label,
  value,
  options,
  onChange,
  sx = INLINE_FIELD_SX,
}) => (
  <TextField
    select
    size="small"
    label={label}
    value={value}
    onChange={(event) => {
      onChange(event.target.value);
    }}
    sx={sx}
  >
    {options.map((option) => (
      <MenuItem key={option.value} value={option.value}>
        {option.label}
      </MenuItem>
    ))}
  </TextField>
);
