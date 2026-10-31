'use client';

import TextField from '@mui/material/TextField';

import type { FC, FocusEvent, KeyboardEvent } from 'react';

interface NumberFilterFieldProps {
  label: string;
  /** The value in the address bar */
  value: string;
  /** Called when the field loses focus or Enter is pressed */
  onCommit: (value: string) => void;
}

/**
 * A number box for a range filter; the list updates when the user leaves the field or presses Enter.
 * Uncontrolled, re-created (key) when the address bar value changes (e.g. "Clear filters").
 */
export const NumberFilterField: FC<NumberFilterFieldProps> = ({ label, value, onCommit }) => {
  const commit = (input: HTMLInputElement): void => {
    const next = input.value.trim();
    if (next !== value) onCommit(next);
  };

  return (
    <TextField
      key={value}
      label={label}
      type="number"
      size="small"
      fullWidth
      defaultValue={value}
      slotProps={{ htmlInput: { min: 0 } }}
      onBlur={(event: FocusEvent<HTMLInputElement>) => {
        commit(event.target);
      }}
      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && event.target instanceof HTMLInputElement) commit(event.target);
      }}
    />
  );
};
