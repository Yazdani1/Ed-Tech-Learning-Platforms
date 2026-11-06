'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppliedCouponBox } from './AppliedCouponBox';

import type { AppliedCoupon } from './useAppliedCoupon';
import type { FC } from 'react';

interface CouponFieldProps {
  coupon: AppliedCoupon;
}

const CODE_MAX = 20;

/**
 * The coupon of the order: the applied code with its saving and the time left (a remove button), or a box to
 * type a code. Removing it shows the list price.
 */
export const CouponField: FC<CouponFieldProps> = ({ coupon }) => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  if (coupon.applied)
    return (
      <AppliedCouponBox offer={coupon.applied} onRemove={coupon.remove} onExpire={coupon.expire} />
    );

  return (
    <Box
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        coupon.apply(text);
      }}
      sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'flex-start' }}
    >
      <TextField
        value={text}
        onChange={(event) => {
          setText(event.target.value);
        }}
        label={t('coupons.field.label')}
        placeholder={t('coupons.field.placeholder')}
        size="small"
        fullWidth
        error={coupon.error !== null}
        helperText={coupon.error?.message ?? t('coupons.field.listPriceNow')}
        slotProps={{ htmlInput: { maxLength: CODE_MAX, style: { textTransform: 'uppercase' } } }}
        sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
      />
      <Button
        type="submit"
        variant="outlined"
        disabled={coupon.checking || text.trim() === ''}
        sx={{ minHeight: 44, flexShrink: 0 }}
      >
        {t('coupons.field.apply')}
      </Button>
    </Box>
  );
};
