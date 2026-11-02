'use client';

import PhoneOutlined from '@mui/icons-material/PhoneOutlined';
import InputAdornment from '@mui/material/InputAdornment';
import TextField, { type OutlinedTextFieldProps } from '@mui/material/TextField';

import type { FC, Ref } from 'react';

interface PhoneFieldProps extends Omit<OutlinedTextFieldProps, 'variant'> {
  ref?: Ref<HTMLInputElement>;
}

/** Optional phone number input with the phone icon (register page), same look as EmailField. */
export const PhoneField: FC<PhoneFieldProps> = ({ ref, ...props }) => (
  <TextField
    {...props}
    inputRef={ref}
    type="tel"
    autoComplete="tel"
    slotProps={{
      input: {
        startAdornment: (
          <InputAdornment position="start">
            <PhoneOutlined fontSize="small" color="action" />
          </InputAdornment>
        ),
      },
    }}
  />
);
