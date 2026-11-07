'use client';

import Chip from '@mui/material/Chip';

import type { FC } from 'react';

interface SelectionChipProps {
  count: number;
  /** "3 selected" */
  label: string;
  onClear: () => void;
}

/** How many rows are ticked, with an × that unticks them all (nothing when none is ticked). */
export const SelectionChip: FC<SelectionChipProps> = ({ count, label, onClear }) =>
  count > 0 ? <Chip label={label} onDelete={onClear} color="primary" variant="outlined" /> : null;
