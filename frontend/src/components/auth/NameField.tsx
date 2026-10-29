'use client';

import PersonOutlined from '@mui/icons-material/PersonOutlined';
import InputAdornment from '@mui/material/InputAdornment';
import TextField, { type OutlinedTextFieldProps } from '@mui/material/TextField';

import type { FC, Ref } from 'react';

interface NameFieldProps extends Omit<OutlinedTextFieldProps, 'variant'> {
  ref?: Ref<HTMLInputElement>;
}

/** Full-name input with the person icon used on the register page. */
export const NameField: FC<NameFieldProps> = ({ ref, ...props }) => (
  <TextField
    {...props}
    inputRef={ref}
    autoComplete="name"
    slotProps={{
      input: {
        startAdornment: (
          <InputAdornment position="start">
            <PersonOutlined fontSize="small" color="action" />
          </InputAdornment>
        ),
      },
    }}
  />
);
