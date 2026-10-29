'use client';

import LockOutlined from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField, { type OutlinedTextFieldProps } from '@mui/material/TextField';
import { useState, type FC, type Ref } from 'react';
import { useTranslation } from 'react-i18next';

interface PasswordFieldProps extends Omit<OutlinedTextFieldProps, 'variant'> {
  ref?: Ref<HTMLInputElement>;
}

/** A password input with a lock icon and a show/hide button. */
export const PasswordField: FC<PasswordFieldProps> = ({ ref, ...props }) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      {...props}
      inputRef={ref}
      type={visible ? 'text' : 'password'}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <LockOutlined fontSize="small" color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
                onClick={() => {
                  setVisible((value) => !value);
                }}
                edge="end"
                sx={{ width: 44, height: 44 }}
              >
                {visible ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
};
