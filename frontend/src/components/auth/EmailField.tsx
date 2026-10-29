'use client';

import EmailOutlined from '@mui/icons-material/EmailOutlined';
import InputAdornment from '@mui/material/InputAdornment';
import TextField, { type OutlinedTextFieldProps } from '@mui/material/TextField';

import type { FC, Ref } from 'react';

interface EmailFieldProps extends Omit<OutlinedTextFieldProps, 'variant'> {
  ref?: Ref<HTMLInputElement>;
}

/** Email input with the envelope icon used on the sign-in and register pages. */
export const EmailField: FC<EmailFieldProps> = ({ ref, ...props }) => (
  <TextField
    {...props}
    inputRef={ref}
    type="email"
    autoComplete="email"
    slotProps={{
      input: {
        startAdornment: (
          <InputAdornment position="start">
            <EmailOutlined fontSize="small" color="action" />
          </InputAdornment>
        ),
      },
    }}
  />
);
