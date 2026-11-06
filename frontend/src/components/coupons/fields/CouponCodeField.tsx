'use client';

import AutorenewIcon from '@mui/icons-material/Autorenew';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from 'react-i18next';

import { useSuggestCouponCode } from '@/api/coupons.api';
import { toastError } from '@/utils/toast-error';

import type { FC } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

interface CouponCodeFieldProps {
  registration: UseFormRegisterReturn;
  label: string;
  required?: boolean;
  error: boolean;
  helperText?: string;
  /** Called with a free code from the server */
  onSuggest: (code: string) => void;
}

const CODE_MAX = 20;

/** A coupon code box (shown in capitals) with a button that fills in a free random code. */
export const CouponCodeField: FC<CouponCodeFieldProps> = ({
  registration,
  label,
  required = false,
  error,
  helperText,
  onSuggest,
}) => {
  const { t } = useTranslation();
  const suggestion = useSuggestCouponCode();
  const suggest = (): void => {
    suggestion.mutateAsync().then(onSuggest).catch(toastError);
  };
  return (
    <TextField
      {...registration}
      label={label}
      required={required}
      fullWidth
      error={error}
      helperText={helperText}
      slotProps={{
        htmlInput: { maxLength: CODE_MAX, style: { textTransform: 'uppercase' } },
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title={t('coupons.suggest')}>
                <IconButton
                  aria-label={t('coupons.suggest')}
                  onClick={suggest}
                  edge="end"
                  sx={{ width: 44, height: 44 }}
                >
                  <AutorenewIcon />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
        },
      }}
    />
  );
};
