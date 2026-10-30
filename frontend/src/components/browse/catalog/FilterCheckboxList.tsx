'use client';

import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Typography from '@mui/material/Typography';

import type { FC } from 'react';

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterCheckboxListProps {
  /** Accessible name of the group (the section title) */
  label: string;
  options: readonly FilterOption[];
  selected: readonly string[];
  counts: Record<string, number>;
  onToggle: (value: string) => void;
  /** Long lists scroll inside the section */
  scroll?: boolean;
}

const LIST_MAX_HEIGHT = 200;

/** One filter group: a checkbox per option with its number of courses on the right. */
export const FilterCheckboxList: FC<FilterCheckboxListProps> = ({
  label,
  options,
  selected,
  counts,
  onToggle,
  scroll = false,
}) => (
  <Box sx={scroll ? { maxHeight: LIST_MAX_HEIGHT, overflowY: 'auto', pr: 0.5 } : undefined}>
    <FormGroup aria-label={label}>
      {options.map((option) => (
        <FormControlLabel
          key={option.value}
          control={
            <Checkbox
              size="small"
              checked={selected.includes(option.value)}
              onChange={() => {
                onToggle(option.value);
              }}
            />
          }
          label={
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, width: '100%' }}>
              <Typography variant="body2" noWrap sx={{ minWidth: 0 }}>
                {option.label}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ flexShrink: 0, fontWeight: 700 }}
                aria-hidden
              >
                ({counts[option.value] ?? 0})
              </Typography>
            </Box>
          }
          sx={{
            mr: 0,
            width: '100%',
            minHeight: 44,
            '& .MuiFormControlLabel-label': { flex: 1, minWidth: 0 },
          }}
        />
      ))}
    </FormGroup>
  </Box>
);
